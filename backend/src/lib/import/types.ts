import { createHash } from "node:crypto";
import type { TransactionType } from "../../generated/prisma/client.js";
import { MAX_CENTAVOS } from "../../schemas/common.schema.js";
import { normalizeText } from "../text.js";

/** Uma transação lida do arquivo, ainda sem categoria nem checagem de duplicidade. */
export interface ParsedTransaction {
  /** Número da linha (CSV) ou do lançamento (OFX) no arquivo, começando em 1. */
  linha: number;
  /** AAAA-MM-DD */
  data: string;
  descricao: string;
  /** Sempre positivo, em centavos; o sinal do arquivo vira o `tipo`. */
  valor: number;
  tipo: TransactionType;
  externalId: string;
}

export interface ParseError {
  linha: number;
  motivo: string;
}

export interface ParseResult {
  itens: ParsedTransaction[];
  erros: ParseError[];
}

/** Erro de arquivo inteiro (não é OFX, está vazio, sem colunas...), mostrado ao usuário como 400. */
export class ImportFileError extends Error {}

const DESCRICAO_MAX = 140;

/** Valida a data (AAAA-MM-DD) e rejeita dias que não existem, como 31/02. */
export function isValidDate(iso: string): boolean {
  const date = new Date(`${iso}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === iso;
}

/** Monta a transação a partir do valor com sinal (negativo = despesa), aplicando as regras comuns. */
export function buildTransaction(
  linha: number,
  data: string,
  descricao: string,
  centavos: number,
  externalId: string,
): ParsedTransaction {
  if (centavos === 0) throw new Error("valor zero");
  if (Math.abs(centavos) > MAX_CENTAVOS) throw new Error("valor acima do limite de R$ 10 milhões");

  return {
    linha,
    data,
    descricao: descricao.replace(/\s+/g, " ").trim().slice(0, DESCRICAO_MAX) || "Sem descrição",
    valor: Math.abs(centavos),
    tipo: centavos < 0 ? "DESPESA" : "RECEITA",
    externalId,
  };
}

/**
 * Identificador para lançamentos sem ID próprio (CSV): hash de data + valor + descrição
 * + posição entre lançamentos iguais no mesmo dia. Assim, reimportar o mesmo arquivo gera
 * os mesmos IDs (não duplica), e duas compras idênticas no mesmo dia continuam distintas.
 */
export function createHashIdGenerator(prefix: string) {
  const seen = new Map<string, number>();

  return (data: string, centavos: number, descricao: string) => {
    const key = `${data}|${centavos}|${normalizeText(descricao)}`;
    const position = (seen.get(key) ?? 0) + 1;
    seen.set(key, position);
    return `${prefix}-${createHash("sha256").update(`${key}|${position}`).digest("hex").slice(0, 32)}`;
  };
}
