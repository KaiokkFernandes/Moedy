/**
 * Datas do app são dias "puros" (sem hora), representados como meia-noite UTC.
 * Estas funções fazem contas de calendário nesse formato.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

const saoPauloDate = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" });

/** O dia de hoje no Brasil (America/Sao_Paulo), independentemente do fuso do servidor. */
export function todayInSaoPaulo(): Date {
  // O formato en-CA é AAAA-MM-DD
  return new Date(`${saoPauloDate.format(new Date())}T00:00:00.000Z`);
}

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** "2026-10" */
export function monthKey(date: Date): string {
  return date.toISOString().slice(0, 7);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function endOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

/** Primeiro dia do mês que fica `months` meses depois (ou antes, se negativo). */
export function addMonths(date: Date, months: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

export function daysBetween(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / DAY_MS);
}

/** Meses (primeiro dia de cada um) de `start` até `end`, inclusive. */
export function monthsBetween(start: Date, end: Date): Date[] {
  const months: Date[] = [];
  for (let month = startOfMonth(start); month <= end; month = addMonths(month, 1)) {
    months.push(month);
  }
  return months;
}

/**
 * Período anterior, para comparação:
 * - meses cheios (dia 1 até o último dia de um mês) → os meses cheios imediatamente anteriores;
 * - qualquer outro intervalo → o mesmo número de dias imediatamente antes.
 */
export function previousPeriod(inicio: Date, fim: Date): { inicio: Date; fim: Date } {
  const fullMonths = inicio.getUTCDate() === 1 && fim.getTime() === endOfMonth(fim).getTime();
  if (fullMonths) {
    const months = monthsBetween(inicio, fim).length;
    return { inicio: addMonths(inicio, -months), fim: endOfMonth(addMonths(inicio, -1)) };
  }

  const days = daysBetween(inicio, fim) + 1;
  return { inicio: addDays(inicio, -days), fim: addDays(inicio, -1) };
}
