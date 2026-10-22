import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { parseCsv, readCsv, suggestMapping, type CsvMapping } from "./csv.js";
import { decodeFile } from "./encoding.js";
import { ImportFileError } from "./types.js";

const amostra = (arquivo: string) => decodeFile(readFileSync(new URL(`../../../samples/${arquivo}`, import.meta.url))).text;

describe("leitura do CSV", () => {
  it("detecta ; , e tabulação pelo cabeçalho", () => {
    assert.equal(readCsv("a;b\n1;2").separador, ";");
    assert.equal(readCsv("a,b\n1,2").separador, ",");
    assert.equal(readCsv("a\tb\n1\t2").separador, "\t");
  });

  it("separador dentro de aspas não conta nem divide a célula", () => {
    const tabela = readCsv('Data;Descrição;Valor\n03/10/2026;"PIX ENVIADO; JOÃO";-54,30');
    assert.deepEqual(tabela.linhas[0]?.celulas, ["03/10/2026", "PIX ENVIADO; JOÃO", "-54,30"]);
  });

  it("aspas escapadas e quebra de linha dentro de aspas, mantendo o número da linha no arquivo", () => {
    const tabela = readCsv('data,descricao,valor\n01/10/2026,"Loja ""A""\nfilial 2",10\n02/10/2026,Outra,20');
    assert.deepEqual(tabela.linhas[0], { numero: 2, celulas: ["01/10/2026", 'Loja "A"\nfilial 2', "10"] });
    assert.equal(tabela.linhas[1]?.numero, 4);
  });

  it("ignora linhas vazias e \\r do Windows", () => {
    const tabela = readCsv("a;b\r\n\r\n1;2\r\n;\r\n3;4\r\n");
    assert.deepEqual(
      tabela.linhas.map((linha) => linha.celulas),
      [
        ["1", "2"],
        ["3", "4"],
      ],
    );
  });

  it("recusa arquivo sem colunas ou só com cabeçalho", () => {
    assert.throws(() => readCsv("um texto qualquer\nsem colunas"), ImportFileError);
    assert.throws(() => readCsv("Data;Valor\n"), (erro) => erro instanceof ImportFileError && /só tem a linha de cabeçalho/.test(erro.message));
  });
});

describe("sugestão de colunas", () => {
  it("coluna única de valor", () => {
    assert.deepEqual(suggestMapping(["Data", "Histórico", "Valor", "Saldo"]), { data: 0, descricao: 1, valor: 2 });
  });

  it("colunas separadas de entrada e saída", () => {
    assert.deepEqual(suggestMapping(["data", "descricao", "entrada", "saida"]), { data: 0, descricao: 1, entrada: 2, saida: 3 });
    assert.deepEqual(suggestMapping(["Date", "Lançamento", "Crédito", "Débito"]), { data: 0, descricao: 1, entrada: 2, saida: 3 });
  });

  it("prefere o nome exato a um que só contém a palavra", () => {
    assert.equal(suggestMapping(["Data de compensação", "Data", "Descrição", "Valor"]).data, 1);
  });

  it("deixa em branco o que não reconhece", () => {
    assert.deepEqual(suggestMapping(["col1", "col2"]), { data: undefined, descricao: undefined, valor: undefined });
  });
});

describe("conversão das linhas", () => {
  const ler = (texto: string, mapeamento: CsvMapping) => parseCsv(readCsv(texto), mapeamento);

  it("aceita vários formatos de data, com hora opcional", () => {
    const { itens, erros } = ler("data;desc;valor\n5/1/2026;a;-1\n05-01-2026;b;-1\n05.01.2026;c;-1\n2026-01-05;d;-1\n2026-01-05 14:30;e;-1\n05/01/2026 08:00;f;-1", { data: 0, descricao: 1, valor: 2 });
    assert.deepEqual(erros, []);
    assert.ok(itens.every((item) => item.data === "2026-01-05"));
  });

  it("erros por linha: data inválida, sem valor, entrada e saída juntas", () => {
    const { itens, erros } = ler("data;desc;entrada;saida\n31/02/2026;a;;1,00\n01/10/2026;b;;\n01/10/2026;c;1,00;2,00\n;d;;1,00\n01/10/2026;ok;;3,00", {
      data: 0,
      descricao: 1,
      entrada: 2,
      saida: 3,
    });
    assert.equal(itens.length, 1);
    assert.deepEqual(erros, [
      { linha: 2, motivo: 'data inválida: "31/02/2026"' },
      { linha: 3, motivo: "linha sem valor" },
      { linha: 4, motivo: "linha com entrada e saída preenchidas" },
      { linha: 5, motivo: "data vazia" },
    ]);
  });

  it("em colunas separadas o sinal vem da coluna, não do número", () => {
    const { itens } = ler("data,desc,entrada,saida\n2026-10-01,a,,-10.00\n2026-10-01,b,-5.00,", { data: 0, descricao: 1, entrada: 2, saida: 3 });
    assert.deepEqual(
      itens.map((item) => [item.tipo, item.valor]),
      [
        ["DESPESA", 1000],
        ["RECEITA", 500],
      ],
    );
  });

  it("extrato de exemplo em latin1 com coluna de valor", () => {
    const texto = amostra("extrato-exemplo.csv");
    const tabela = readCsv(texto);
    const { itens, erros } = parseCsv(tabela, suggestMapping(tabela.cabecalhos) as CsvMapping);
    // "SALDO ANTERIOR" não tem valor e 31/02 não existe: viram erro, o resto entra
    assert.deepEqual(
      erros.map((erro) => erro.motivo),
      ["linha sem valor", 'data inválida: "31/02/2026"'],
    );
    assert.ok(itens.length >= 10);
    assert.ok(itens.some((item) => item.descricao === "SUPERMERCADO PÃO DE AÇÚCAR" && item.valor === 33549 && item.tipo === "DESPESA"));
    // As duas corridas de Uber iguais no mesmo dia continuam sendo duas
    const ubers = itens.filter((item) => item.descricao === "UBER *TRIP");
    assert.equal(ubers.length, 2);
    assert.notEqual(ubers[0]?.externalId, ubers[1]?.externalId);
  });

  it("extrato de exemplo com entrada e saída e valores no formato americano", () => {
    const tabela = readCsv(amostra("extrato-entrada-saida.csv"));
    const { itens, erros } = parseCsv(tabela, suggestMapping(tabela.cabecalhos) as CsvMapping);
    assert.deepEqual(erros, []);
    assert.ok(itens.some((item) => item.descricao === "Curso de Inglês" && item.valor === 125000 && item.tipo === "DESPESA"));
    assert.ok(itens.some((item) => item.descricao === "Rendimento poupança" && item.valor === 1234 && item.tipo === "RECEITA"));
  });
});
