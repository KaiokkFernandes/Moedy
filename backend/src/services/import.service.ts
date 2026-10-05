import { parseCsv, readCsv, suggestMapping } from "../lib/import/csv.js";
import { decodeFile } from "../lib/import/encoding.js";
import { parseOfx } from "../lib/import/ofx.js";
import { ImportFileError, type ParseResult } from "../lib/import/types.js";
import { prisma } from "../lib/prisma.js";
import { normalizeText } from "../lib/text.js";
import { AppError } from "../middlewares/errorHandler.js";
import type { ConfirmInput, CsvMappingInput } from "../schemas/import.schema.js";
import { getMatcher } from "./categoryRule.service.js";

interface UploadedFile {
  originalname: string;
  buffer: Buffer;
}

const CSV_SAMPLE_ROWS = 5;

/** Descrições típicas de pagamento de fatura e de transferência entre contas do próprio titular. */
const TRANSFER_PATTERNS = [
  /\b(pagamento|pagto|pgto|pag)\.? (de |da )?fatura\b/,
  /\bfatura (do |de )?cartao\b/,
  /\btransf(erencia)?\.? entre contas\b/,
  /\bmesma titularidade\b/,
];

function looksLikeTransfer(descricao: string) {
  const text = normalizeText(descricao);
  return TRANSFER_PATTERNS.some((pattern) => pattern.test(text));
}

async function assertAccountOwned(userId: string, accountId: string) {
  const account = await prisma.account.findFirst({ where: { id: accountId, userId } });
  if (!account) {
    throw new AppError("Conta não encontrada", 404);
  }
}

/** Monta a revisão: sugere categorias pelas regras e marca o que já existe na conta. */
async function buildReview(userId: string, accountId: string, formato: "ofx" | "csv", parsed: ParseResult) {
  const [match, existing] = await Promise.all([
    getMatcher(userId),
    prisma.transaction.findMany({
      where: { accountId, externalId: { in: parsed.itens.map((item) => item.externalId) } },
      select: { externalId: true },
    }),
  ]);
  const existingIds = new Set(existing.map((transaction) => transaction.externalId));

  const itens = parsed.itens.map((item) => ({
    ...item,
    categoryId: match(item.descricao, item.tipo),
    // Só uma sugestão: o usuário confirma ou desmarca na revisão
    ignorarNosRelatorios: looksLikeTransfer(item.descricao),
    duplicada: existingIds.has(item.externalId),
  }));
  const duplicadas = itens.filter((item) => item.duplicada).length;

  return {
    formato,
    etapa: "revisao" as const,
    itens,
    erros: parsed.erros,
    resumo: {
      total: itens.length + parsed.erros.length,
      novas: itens.length - duplicadas,
      duplicadas,
      comErro: parsed.erros.length,
    },
  };
}

/** Lê o arquivo e devolve o que seria importado, sem gravar nada. */
export async function preview(userId: string, accountId: string, file: UploadedFile, mapeamento?: CsvMappingInput) {
  await assertAccountOwned(userId, accountId);

  if (file.buffer.length === 0) {
    throw new AppError("O arquivo está vazio", 400);
  }
  const { text } = decodeFile(file.buffer);
  if (!text.trim()) {
    throw new AppError("O arquivo está vazio", 400);
  }

  try {
    if (file.originalname.toLowerCase().endsWith(".ofx")) {
      return await buildReview(userId, accountId, "ofx", parseOfx(text));
    }

    const table = readCsv(text);

    // Primeira chamada do CSV: devolve as colunas para o usuário mapear
    if (!mapeamento) {
      return {
        formato: "csv" as const,
        etapa: "mapeamento" as const,
        separador: table.separador,
        cabecalhos: table.cabecalhos,
        amostra: table.linhas.slice(0, CSV_SAMPLE_ROWS).map((linha) => linha.celulas),
        totalLinhas: table.linhas.length,
        mapeamentoSugerido: suggestMapping(table.cabecalhos),
      };
    }

    const columns = [mapeamento.data, mapeamento.descricao, mapeamento.valor, mapeamento.entrada, mapeamento.saida];
    if (columns.some((column) => column !== undefined && column >= table.cabecalhos.length)) {
      throw new ImportFileError("O mapeamento aponta para uma coluna que não existe no arquivo");
    }

    return await buildReview(userId, accountId, "csv", parseCsv(table, mapeamento));
  } catch (error) {
    if (error instanceof ImportFileError) {
      throw new AppError(error.message, 400);
    }
    throw error;
  }
}

/** Grava as transações revisadas, ignorando as que já existem na conta. */
export async function confirm(userId: string, { accountId, itens }: ConfirmInput) {
  await assertAccountOwned(userId, accountId);

  // Cada categoria usada precisa ser do usuário e do mesmo tipo da transação
  const categories = await prisma.category.findMany({ where: { userId }, select: { id: true, tipo: true } });
  const tipoByCategory = new Map(categories.map((category) => [category.id, category.tipo]));

  itens.forEach((item, index) => {
    if (!item.categoryId) return;
    const tipo = tipoByCategory.get(item.categoryId);
    if (!tipo) {
      throw new AppError(`Categoria não encontrada (item ${index + 1}: "${item.descricao}")`, 404);
    }
    if (tipo !== item.tipo) {
      throw new AppError(
        `A categoria do item ${index + 1} ("${item.descricao}") não é do mesmo tipo (despesa/receita) da transação`,
        400,
      );
    }
  });

  // Uma única instrução dentro de uma transação do banco: ou grava tudo, ou nada.
  // O índice único (accountId, externalId) faz o skipDuplicates ignorar o que já existe
  // na conta e também itens repetidos dentro da própria lista.
  const { count } = await prisma.$transaction((tx) =>
    tx.transaction.createMany({
      skipDuplicates: true,
      data: itens.map((item) => ({ ...item, accountId })),
    }),
  );

  return { importadas: count, ignoradas: itens.length - count };
}
