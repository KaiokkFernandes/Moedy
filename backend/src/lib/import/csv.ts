import { normalizeText } from "../text.js";
import { parseCentavos } from "./money.js";
import {
  buildTransaction,
  createHashIdGenerator,
  ImportFileError,
  isValidDate,
  type ParseResult,
} from "./types.js";

export type CsvSeparator = ";" | "," | "\t";

/** Índice (a partir de 0) da coluna de cada informação. Use `valor` OU `entrada`/`saida`. */
export interface CsvMapping {
  data: number;
  descricao: number;
  valor?: number;
  entrada?: number;
  saida?: number;
}

export interface CsvTable {
  separador: CsvSeparator;
  cabecalhos: string[];
  /** Linhas de dados, com o número da linha no arquivo (o cabeçalho é a linha 1). */
  linhas: { numero: number; celulas: string[] }[];
}

/** O separador é o que mais aparece na primeira linha, fora de aspas. */
function detectSeparator(text: string): CsvSeparator {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim()) ?? "";
  const outsideQuotes = firstLine.replace(/"[^"]*"/g, "");
  const count = (separator: string) => outsideQuotes.split(separator).length - 1;

  const candidates: CsvSeparator[] = [";", ",", "\t"];
  return candidates.reduce((best, candidate) => (count(candidate) > count(best) ? candidate : best));
}

/** Divide o texto em linhas e células, respeitando aspas (inclusive quebras de linha dentro delas). */
function splitRows(text: string, separator: string): { numero: number; celulas: string[] }[] {
  const rows: { numero: number; celulas: string[] }[] = [];
  let cells: string[] = [];
  let cell = "";
  let inQuotes = false;
  let line = 1;
  let rowLine = 1;

  const endRow = () => {
    cells.push(cell.trim());
    if (cells.some((value) => value !== "")) rows.push({ numero: rowLine, celulas: cells });
    cells = [];
    cell = "";
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i]!;
    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        if (char === "\n") line++;
        cell += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === separator) {
      cells.push(cell.trim());
      cell = "";
    } else if (char === "\n") {
      endRow();
      line++;
      rowLine = line;
    } else if (char !== "\r") {
      cell += char;
    }
  }
  endRow();

  return rows;
}

export function readCsv(text: string): CsvTable {
  const separador = detectSeparator(text);
  const [header, ...linhas] = splitRows(text, separador);

  if (!header || header.celulas.length < 2) {
    throw new ImportFileError("O arquivo não parece um CSV: não encontrei colunas separadas por ; ou ,");
  }
  if (linhas.length === 0) {
    throw new ImportFileError("O CSV só tem a linha de cabeçalho, sem lançamentos");
  }

  return { separador, cabecalhos: header.celulas, linhas };
}

/** Sugere o mapeamento a partir dos nomes das colunas, para o usuário só conferir. */
export function suggestMapping(cabecalhos: string[]): Partial<CsvMapping> {
  const names = cabecalhos.map(normalizeText);
  const find = (...patterns: RegExp[]) => {
    for (const pattern of patterns) {
      const index = names.findIndex((name) => pattern.test(name));
      if (index >= 0) return index;
    }
    return undefined;
  };

  const entrada = find(/entrada/, /credito/);
  const saida = find(/saida/, /debito/);
  const separadas = entrada !== undefined && saida !== undefined;

  return {
    data: find(/^data$/, /data/, /date/),
    descricao: find(/descri/, /historico/, /lancamento/, /memo/, /estabelecimento/, /titulo/),
    ...(separadas ? { entrada, saida } : { valor: find(/^valor$/, /valor/, /amount/, /montante/, /quantia/) }),
  };
}

/** Aceita dd/mm/aaaa, dd-mm-aaaa, dd.mm.aaaa e aaaa-mm-dd (com hora opcional depois). */
function parseDate(value: string): string {
  const br = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})(?:\D.*)?$/.exec(value);
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:\D.*)?$/.exec(value);

  const data = br
    ? `${br[3]}-${br[2]!.padStart(2, "0")}-${br[1]!.padStart(2, "0")}`
    : iso
      ? `${iso[1]}-${iso[2]}-${iso[3]}`
      : "";

  if (!value) throw new Error("data vazia");
  if (!data || !isValidDate(data)) throw new Error(`data inválida: "${value}"`);
  return data;
}

/** Converte as linhas do CSV em transações usando o mapeamento de colunas escolhido. */
export function parseCsv(table: CsvTable, mapping: CsvMapping): ParseResult {
  const result: ParseResult = { itens: [], erros: [] };
  const hashId = createHashIdGenerator("csv");

  for (const { numero, celulas } of table.linhas) {
    const cell = (index: number | undefined) => (index === undefined ? "" : (celulas[index] ?? ""));

    try {
      const data = parseDate(cell(mapping.data));
      const descricao = cell(mapping.descricao);

      let centavos: number;
      if (mapping.valor !== undefined) {
        if (!cell(mapping.valor)) throw new Error("linha sem valor");
        centavos = parseCentavos(cell(mapping.valor));
      } else {
        // Colunas separadas: o sinal vem da coluna, não do número
        const entrada = cell(mapping.entrada) ? Math.abs(parseCentavos(cell(mapping.entrada))) : 0;
        const saida = cell(mapping.saida) ? Math.abs(parseCentavos(cell(mapping.saida))) : 0;
        if (entrada && saida) throw new Error("linha com entrada e saída preenchidas");
        if (!entrada && !saida) throw new Error("linha sem valor");
        centavos = entrada || -saida;
      }

      result.itens.push(buildTransaction(numero, data, descricao, centavos, hashId(data, centavos, descricao)));
    } catch (error) {
      result.erros.push({ linha: numero, motivo: (error as Error).message });
    }
  }

  return result;
}
