import { merchantKey } from "../../lib/merchant.js";
import type { AiTransactionInput } from "./types.js";

export interface CategorizeInput {
  indice: number;
  descricao: string;
  valor: number;
  tipo: "DESPESA" | "RECEITA";
}

/** Lançamentos com a mesma descrição (depois de normalizada) e o mesmo tipo: pagos uma vez só. */
export interface DescriptionGroup {
  descricao: string;
  valor: number;
  tipo: "DESPESA" | "RECEITA";
  /** Índices dos lançamentos originais que compartilham a sugestão. */
  indices: number[];
}

export function groupByDescription(items: CategorizeInput[]): DescriptionGroup[] {
  const groups = new Map<string, DescriptionGroup>();
  for (const item of items) {
    const key = `${item.tipo}|${merchantKey(item.descricao)}`;
    const group = groups.get(key);
    if (group) {
      group.indices.push(item.indice);
    } else {
      // O representante é o primeiro lançamento do grupo, com a descrição original
      groups.set(key, { descricao: item.descricao, valor: item.valor, tipo: item.tipo, indices: [item.indice] });
    }
  }
  return [...groups.values()];
}

export function chunk<T>(list: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let start = 0; start < list.length; start += size) {
    batches.push(list.slice(start, start + size));
  }
  return batches;
}

/** Executa `task` em cada item com no máximo `limit` tarefas ao mesmo tempo. */
export async function mapWithConcurrency<T>(items: T[], limit: number, task: (item: T) => Promise<void>) {
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const item = items[next];
      next += 1;
      await task(item!);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}

/** Monta o que vai para a IA: um item por grupo, com o índice local do grupo no lote. */
export function toAiPayload(batch: DescriptionGroup[]): AiTransactionInput[] {
  return batch.map((group, indice) => ({
    indice,
    descricao: group.descricao,
    valor: group.valor,
    tipo: group.tipo,
  }));
}
