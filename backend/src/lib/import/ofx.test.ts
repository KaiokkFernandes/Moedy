import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { parseOfx } from "./ofx.js";
import { ImportFileError } from "./types.js";

const ofx = (...lancamentos: string[]) => `OFXHEADER:100\n<OFX><BANKMSGSRSV1><BANKTRANLIST>\n${lancamentos.join("\n")}\n</BANKTRANLIST></BANKMSGSRSV1></OFX>`;
const sgml = (campos: Record<string, string>) =>
  `<STMTTRN>\n${Object.entries(campos)
    .map(([tag, valor]) => `<${tag}>${valor}`)
    .join("\n")}\n</STMTTRN>`;
const xml = (campos: Record<string, string>) =>
  `<STMTTRN>${Object.entries(campos)
    .map(([tag, valor]) => `<${tag}>${valor}</${tag}>`)
    .join("")}</STMTTRN>`;
const amostra = (arquivo: string) => readFileSync(new URL(`../../../samples/${arquivo}`, import.meta.url), "latin1");

describe("leitura de OFX", () => {
  it("formato SGML (sem fechamento das tags), com data, hora e fuso", () => {
    const { itens, erros } = parseOfx(ofx(sgml({ DTPOSTED: "20261005120000[-3:BRT]", TRNAMT: "-35.49", FITID: "A1", MEMO: "PADARIA" })));
    assert.deepEqual(erros, []);
    assert.deepEqual(itens, [{ linha: 1, data: "2026-10-05", descricao: "PADARIA", valor: 3549, tipo: "DESPESA", externalId: "A1" }]);
  });

  it("formato XML, e NAME quando não há MEMO", () => {
    const { itens } = parseOfx(ofx(xml({ DTPOSTED: "20261001", TRNAMT: "6500.00", FITID: "B1", NAME: "SALARIO" })));
    assert.equal(itens[0]?.descricao, "SALARIO");
    assert.equal(itens[0]?.tipo, "RECEITA");
    assert.equal(itens[0]?.valor, 650000);
  });

  it("decodifica entidades do XML na descrição", () => {
    const { itens } = parseOfx(ofx(sgml({ DTPOSTED: "20261001", TRNAMT: "-1", FITID: "C1", MEMO: "PADARIA &amp; CAFE &lt;CENTRO&gt;" })));
    assert.equal(itens[0]?.descricao, "PADARIA & CAFE <CENTRO>");
  });

  it("FITID repetido no mesmo arquivo ganha sufixo estável", () => {
    const repetido = { DTPOSTED: "20261001", TRNAMT: "-10.00", FITID: "DUP", MEMO: "X" };
    const { itens } = parseOfx(ofx(sgml(repetido), sgml(repetido), sgml(repetido)));
    assert.deepEqual(
      itens.map((item) => item.externalId),
      ["DUP", "DUP#2", "DUP#3"],
    );
  });

  it("sem FITID, gera um ID pelo conteúdo, igual a cada leitura", () => {
    const arquivo = ofx(sgml({ DTPOSTED: "20261001", TRNAMT: "-10.00", MEMO: "SEM ID" }));
    const id = parseOfx(arquivo).itens[0]?.externalId;
    assert.match(id ?? "", /^ofx-[0-9a-f]{32}$/);
    assert.equal(parseOfx(arquivo).itens[0]?.externalId, id);
  });

  it("lançamento com problema vira erro da linha, sem derrubar os outros", () => {
    const { itens, erros } = parseOfx(
      ofx(
        sgml({ DTPOSTED: "20261001", TRNAMT: "-10.00", FITID: "OK", MEMO: "OK" }),
        sgml({ DTPOSTED: "20260231", TRNAMT: "-10.00", FITID: "D1" }),
        sgml({ TRNAMT: "-10.00", FITID: "D2" }),
        sgml({ DTPOSTED: "20261001", FITID: "D3" }),
        sgml({ DTPOSTED: "20261001", TRNAMT: "0.00", FITID: "D4" }),
      ),
    );
    assert.equal(itens.length, 1);
    assert.deepEqual(erros, [
      { linha: 2, motivo: 'data inválida: "20260231"' },
      { linha: 3, motivo: "lançamento sem data (DTPOSTED)" },
      { linha: 4, motivo: "lançamento sem valor (TRNAMT)" },
      { linha: 5, motivo: "valor zero" },
    ]);
  });

  it("arquivo que não é OFX, ou sem lançamentos, é recusado inteiro", () => {
    assert.throws(() => parseOfx("Data;Valor\n01/10/2026;10,00"), (erro) => erro instanceof ImportFileError && /não é um OFX/.test(erro.message));
    assert.throws(() => parseOfx("<OFX></OFX>"), (erro) => erro instanceof ImportFileError && /Nenhum lançamento/.test(erro.message));
  });

  it("os OFX de exemplo (conta corrente em SGML e fatura em XML) são lidos como documentado em samples/README.md", () => {
    const conta = parseOfx(amostra("extrato-conta-corrente.ofx"));
    const fatura = parseOfx(amostra("fatura-cartao.ofx"));
    // O extrato traz de propósito um lançamento de valor zero, que vira erro
    assert.deepEqual(conta.erros, [{ linha: 12, motivo: "valor zero" }]);
    assert.deepEqual(fatura.erros, []);
    assert.ok(conta.itens.some((item) => item.descricao.includes("&") && !item.descricao.includes("&amp;")));
    assert.ok(fatura.itens.some((item) => item.tipo === "RECEITA"), "a fatura tem um estorno");
    assert.equal(fatura.itens.length, 12);
    assert.ok(conta.itens.length > 0);
    assert.ok(fatura.itens.every((item) => /^\d{4}-\d{2}-\d{2}$/.test(item.data) && item.valor > 0));
  });
});
