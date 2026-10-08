import { parseCsv, readCsv, suggestMapping } from "../lib/import/csv.js";
import { decodeFile } from "../lib/import/encoding.js";
import { parseOfx } from "../lib/import/ofx.js";
import { ImportFileError, type ParseResult } from "../lib/import/types.js";
import { logger } from "../lib/logger.js";
import { prisma } from "../lib/prisma.js";
import { normalizeText } from "../lib/text.js";
import { AppError } from "../middlewares/errorHandler.js";
import type { ConfirmInput, CsvMappingInput } from "../schemas/import.schema.js";
import { remember } from "./categoryMemory.service.js";
import { suggestCategories, type IaStatus, type OrigemSugestao } from "./categorization.service.js";

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

/**
 * Monta a revisão: sugere categorias (regras, memória e, se ligada, IA) e marca o que já existe
 * na conta. Duplicadas não são categorizadas: não vão para a IA nem gastam chamadas.
 */
async function buildReview(
  userId: string,
  accountId: string,
  formato: "ofx" | "csv",
  parsed: ParseResult,
  usarIa: boolean,
) {
  const existing = await prisma.transaction.findMany({
    where: { accountId, externalId: { in: parsed.itens.map((item) => item.externalId) } },
    select: { externalId: true },
  });
  const existingIds = new Set(existing.map((transaction) => transaction.externalId));

  const pendentes = parsed.itens
    .map((item, indice) => ({ item, indice }))
    .filter(({ item }) => !existingIds.has(item.externalId));

  const { sugestoes, ia } = await suggestCategories(
    userId,
    pendentes.map(({ item, indice }) => ({ indice, descricao: item.descricao, valor: item.valor, tipo: item.tipo })),
    { usarIa },
  );

  const itens = parsed.itens.map((item, indice) => {
    const sugestao = sugestoes.get(indice);
    return {
      ...item,
      categoryId: sugestao?.categoryId ?? null,
      origemCategoria: (sugestao?.origem ?? null) as OrigemSugestao | null,
      confianca: sugestao?.confianca ?? null,
      // Só uma sugestão: o usuário confirma ou desmarca na revisão
      ignorarNosRelatorios: looksLikeTransfer(item.descricao),
      duplicada: existingIds.has(item.externalId),
    };
  });

  const novas = itens.filter((item) => !item.duplicada);
  const porOrigem: Record<OrigemSugestao, number> = { REGRA: 0, MEMORIA: 0, IA: 0 };
  for (const item of novas) {
    if (item.origemCategoria) porOrigem[item.origemCategoria] += 1;
  }

  return {
    formato,
    etapa: "revisao" as const,
    itens,
    erros: parsed.erros,
    resumo: {
      total: itens.length + parsed.erros.length,
      novas: novas.length,
      duplicadas: itens.length - novas.length,
      comErro: parsed.erros.length,
      /** Quantas das novas receberam categoria de cada origem. */
      porOrigem,
      semCategoria: novas.filter((item) => !item.categoryId).length,
    },
    ia: {
      status: ia.status as IaStatus,
      motivo: ia.motivo,
      enviadas: ia.enviadas,
      naoEnviadas: ia.naoEnviadas,
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

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { usarIaImportacao: true } });
  const usarIa = user?.usarIaImportacao ?? false;

  try {
    if (file.originalname.toLowerCase().endsWith(".ofx")) {
      return await buildReview(userId, accountId, "ofx", parseOfx(text), usarIa);
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

    return await buildReview(userId, accountId, "csv", parseCsv(table, mapeamento), usarIa);
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
  const created = await prisma.$transaction((tx) =>
    tx.transaction.createManyAndReturn({
      skipDuplicates: true,
      data: itens.map(({ origemCategoria, ...item }) => ({
        ...item,
        accountId,
        origemCategoria: origemCategoria ?? "MANUAL",
      })),
      select: { id: true },
    }),
  );

  // A categoria confirmada pelo usuário vira memória, para as próximas importações. Não é
  // essencial para a importação: se falhar, só fica registrado.
  try {
    await remember(
      userId,
      itens.flatMap((item) => (item.categoryId ? [{ descricao: item.descricao, tipo: item.tipo, categoryId: item.categoryId }] : [])),
    );
  } catch (error) {
    logger.warn({ erro: error instanceof Error ? error.name : "desconhecido" }, "Memória de categorias: não foi possível gravar a importação");
  }

  return {
    importadas: created.length,
    ignoradas: itens.length - created.length,
    /** Ids das transações criadas, para a verificação de alertas. */
    ids: created.map((transaction) => transaction.id),
  };
}
