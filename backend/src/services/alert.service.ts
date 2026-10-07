import type { NotificationType, Prisma } from "../generated/prisma/client.js";
import { addMonths, endOfMonth, monthKey, startOfMonth, todayInSaoPaulo, toISODate } from "../lib/dates.js";
import { formatBRL, formatPercent, monthName } from "../lib/format.js";
import { merchantKey, merchantName } from "../lib/merchant.js";
import { logger } from "../lib/logger.js";
import { prisma } from "../lib/prisma.js";
import * as budgetService from "./budget.service.js";
import { recurring, reportWhere } from "./report.service.js";

/*
 * Geração de alertas. Cada alerta tem uma `chave` que identifica o motivo; o índice único
 * (usuário, chave) garante que o mesmo alerta nunca é criado duas vezes, por mais vezes que
 * a verificação rode.
 */

/** A projeção só vira alerta a partir deste dia: antes, uma única compra distorce o ritmo do mês. */
const PROJECTION_MIN_DAY = 5;
/** Despesa atípica: mais de 3x a média da categoria nos últimos 3 meses... */
const UNUSUAL_FACTOR = 3;
const UNUSUAL_MONTHS = 3;
/** ...com pelo menos 3 despesas para a média significar algo, e a partir de R$ 50 para não alertar por trocados. */
const UNUSUAL_MIN_SAMPLES = 3;
const UNUSUAL_MIN_VALUE = 5000;
/** Recorrente "mudou de valor": diferença acima de 5% (e de R$ 1) em relação à última cobrança. */
const RECURRING_CHANGE_PERCENT = 5;
const RECURRING_CHANGE_MIN = 100;
/** Em importações de histórico longo, só os meses mais recentes têm os orçamentos verificados. */
const MAX_BUDGET_MONTHS = 12;

interface NewNotification {
  tipo: NotificationType;
  chave: string;
  titulo: string;
  mensagem: string;
  link: string;
}

type CheckedTransaction = Prisma.TransactionGetPayload<{ include: { category: true } }>;

/** Orçamentos que passaram de 80%, estouraram ou devem estourar no ritmo atual. */
async function budgetAlerts(userId: string, months: { mes: number; ano: number }[], today: Date) {
  const notifications: NewNotification[] = [];

  for (const month of months) {
    const { orcamentos, mesAtual } = await budgetService.list(userId, month);
    const periodo = `${monthName(month.mes)} de ${month.ano}`;
    const link = `/orcamentos?mes=${month.ano}-${String(month.mes).padStart(2, "0")}`;

    for (const budget of orcamentos) {
      const { nome } = budget.categoria;
      const gasto = formatBRL(budget.gasto);
      const limite = formatBRL(budget.valorLimite);

      if (budget.status === "ESTOURADO") {
        notifications.push({
          tipo: "ORCAMENTO_ESTOURADO",
          chave: `orcamento:${budget.id}:estourado`,
          titulo: `Orçamento de ${nome} estourado`,
          mensagem:
            budget.restante === 0
              ? `Você gastou todo o limite de ${limite} em ${periodo}.`
              : `Você gastou ${gasto} em ${periodo}, ${formatBRL(-budget.restante)} acima do limite de ${limite}.`,
          link,
        });
      } else if (budget.status === "ATENCAO") {
        notifications.push({
          tipo: "ORCAMENTO_ATENCAO",
          chave: `orcamento:${budget.id}:atencao`,
          titulo: `Orçamento de ${nome} em ${formatPercent(budget.percentual)}`,
          mensagem: `Você já gastou ${gasto} do limite de ${limite} em ${periodo}. Restam ${formatBRL(budget.restante)}.`,
          link,
        });
      }

      if (mesAtual && budget.projecao?.vaiEstourar && today.getUTCDate() >= PROJECTION_MIN_DAY) {
        notifications.push({
          tipo: "ORCAMENTO_PROJECAO",
          chave: `orcamento:${budget.id}:projecao`,
          titulo: `Orçamento de ${nome} pode estourar`,
          mensagem: `No ritmo atual, ${nome} deve fechar ${periodo} em ${formatBRL(budget.projecao.valor)}, acima do limite de ${limite}.`,
          link,
        });
      }
    }
  }

  return notifications;
}

function transactionLink(transaction: CheckedTransaction) {
  const data = toISODate(transaction.data);
  return `/transacoes?inicio=${data}&fim=${data}&busca=${encodeURIComponent(transaction.descricao)}`;
}

/** Despesas muito acima da média da categoria. Só olha transações deste mês e do anterior. */
async function unusualExpenseAlerts(userId: string, transactions: CheckedTransaction[], today: Date) {
  const recent = transactions.filter(
    (transaction) =>
      transaction.categoryId &&
      transaction.valor >= UNUSUAL_MIN_VALUE &&
      transaction.data >= addMonths(startOfMonth(today), -1),
  );
  if (recent.length === 0) return [];

  // Média por categoria calculada pelo banco, sem contar as próprias transações em verificação
  const averages = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      ...reportWhere(userId, undefined, { inicio: addMonths(today, -UNUSUAL_MONTHS), fim: today }),
      tipo: "DESPESA",
      categoryId: { in: recent.map((transaction) => transaction.categoryId!) },
      id: { notIn: transactions.map((transaction) => transaction.id) },
    },
    _avg: { valor: true },
    _count: { _all: true },
  });

  return recent.flatMap((transaction): NewNotification[] => {
    const stats = averages.find((group) => group.categoryId === transaction.categoryId);
    const media = stats?._avg.valor ?? 0;
    if (!stats || stats._count._all < UNUSUAL_MIN_SAMPLES || transaction.valor <= media * UNUSUAL_FACTOR) return [];

    const categoria = transaction.category!.nome;
    return [
      {
        tipo: "DESPESA_ATIPICA",
        chave: `despesa-atipica:${transaction.id}`,
        titulo: `Despesa acima do normal em ${categoria}`,
        mensagem: `${transaction.descricao}: ${formatBRL(transaction.valor)}, mais de ${UNUSUAL_FACTOR} vezes a média de ${formatBRL(Math.round(media))} das despesas de ${categoria} nos últimos ${UNUSUAL_MONTHS} meses.`,
        link: transactionLink(transaction),
      },
    ];
  });
}

/**
 * Cobranças recorrentes: avisa quando uma transação deste mês completa o 3º mês seguido de
 * uma cobrança (recorrente nova) ou vem com valor diferente de uma recorrente já conhecida.
 */
async function recurringAlerts(userId: string, transactions: CheckedTransaction[], today: Date) {
  const thisMonth = transactions.filter((transaction) => monthKey(transaction.data) === monthKey(today));
  if (thisMonth.length === 0) return [];

  // O que já era recorrente até o mês passado, e o que é recorrente contando este mês
  const [before, now] = await Promise.all([
    recurring(userId, { meses: 12, dataFim: endOfMonth(addMonths(today, -1)) }),
    recurring(userId, { meses: 12 }),
  ]);

  return thisMonth.flatMap((transaction): NewNotification[] => {
    const chave = merchantKey(transaction.descricao);
    const nome = merchantName(transaction.descricao);
    const known = before.recorrentes.find((item) => item.chave === chave);

    if (known) {
      const diferenca = transaction.valor - known.ultimoValor;
      const mudou =
        Math.abs(diferenca) >= RECURRING_CHANGE_MIN &&
        Math.abs(diferenca) * 100 > known.ultimoValor * RECURRING_CHANGE_PERCENT;
      if (!mudou) return [];

      const variacao = formatPercent(Math.round((Math.abs(diferenca) / known.ultimoValor) * 1000) / 10);
      return [
        {
          tipo: "RECORRENTE_VALOR",
          chave: `recorrente-valor:${chave}:${monthKey(today)}`,
          titulo: `${nome} ${diferenca > 0 ? "ficou mais cara" : "ficou mais barata"}`,
          mensagem: `A cobrança passou de ${formatBRL(known.ultimoValor)} para ${formatBRL(transaction.valor)} (${diferenca > 0 ? "+" : "−"}${variacao}).`,
          link: transactionLink(transaction),
        },
      ];
    }

    const detected = now.recorrentes.find((item) => item.chave === chave);
    if (!detected || detected.mesesSeguidos !== 3) return [];

    return [
      {
        tipo: "RECORRENTE_NOVA",
        chave: `recorrente-nova:${chave}`,
        titulo: `Nova cobrança recorrente: ${nome}`,
        mensagem: `${nome} foi cobrada por 3 meses seguidos, cerca de ${formatBRL(detected.valorMedio)} por mês (${formatBRL(detected.custoAnual)} por ano).`,
        link: "/relatorios?aba=recorrentes",
      },
    ];
  });
}

/**
 * Verifica e cria os alertas do usuário. `transactionIds` são as transações recém-criadas ou
 * editadas: além dos orçamentos, elas são checadas como despesa atípica e cobrança recorrente.
 * Devolve quantos alertas novos foram criados.
 */
export async function checkAlerts(userId: string, transactionIds: string[] = []): Promise<number> {
  const today = todayInSaoPaulo();

  const transactions = transactionIds.length
    ? await prisma.transaction.findMany({
        where: {
          id: { in: transactionIds },
          account: { userId },
          tipo: "DESPESA",
          ignorarNosRelatorios: false,
        },
        include: { category: true },
      })
    : [];

  // Orçamentos do mês atual e dos meses das transações verificadas
  const monthKeys = new Set([monthKey(today), ...transactions.map((transaction) => monthKey(transaction.data))]);
  const months = [...monthKeys]
    .sort()
    .slice(-MAX_BUDGET_MONTHS)
    .map((key) => ({ ano: Number(key.slice(0, 4)), mes: Number(key.slice(5, 7)) }));

  const notifications = [
    ...(await budgetAlerts(userId, months, today)),
    ...(await unusualExpenseAlerts(userId, transactions, today)),
    ...(await recurringAlerts(userId, transactions, today)),
  ];
  if (notifications.length === 0) return 0;

  const { count } = await prisma.notification.createMany({
    skipDuplicates: true,
    data: notifications.map((notification) => ({ ...notification, userId })),
  });
  return count;
}

/**
 * Versão que nunca lança erro: alertas são um complemento, e uma falha neles não pode
 * derrubar a operação principal (salvar a transação, concluir a importação).
 */
export async function checkAlertsSafely(userId: string, transactionIds: string[] = []): Promise<number> {
  try {
    return await checkAlerts(userId, transactionIds);
  } catch (error) {
    logger.error({ err: error, userId }, "Falha ao gerar alertas");
    return 0;
  }
}
