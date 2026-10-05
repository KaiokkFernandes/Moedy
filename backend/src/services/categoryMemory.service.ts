import type { TransactionType } from "../generated/prisma/client.js";
import { merchantKey } from "../lib/merchant.js";
import { prisma } from "../lib/prisma.js";

export interface MemoryEntry {
  descricao: string;
  tipo: TransactionType;
  categoryId: string;
}

/** Chave da memória: a descrição normalizada (sem acento, sem parcela nem código) e o tipo. */
export function memoryKey(descricao: string, tipo: TransactionType): string {
  return `${tipo}|${merchantKey(descricao)}`;
}

/** Memória do usuário, indexada por `memoryKey`. */
export async function loadMemory(userId: string): Promise<Map<string, string>> {
  const rows = await prisma.categoryMemory.findMany({
    where: { userId },
    select: { chave: true, tipo: true, categoryId: true },
  });
  return new Map(rows.map((row) => [`${row.tipo}|${row.chave}`, row.categoryId]));
}

/**
 * Grava a escolha do usuário. Se a descrição já tinha uma categoria, a nova substitui a anterior.
 * Descrições repetidas no mesmo pedido valem só uma vez (a última escolha).
 */
export async function remember(userId: string, entries: MemoryEntry[]): Promise<number> {
  const unique = new Map<string, { chave: string; tipo: TransactionType; categoryId: string }>();
  for (const entry of entries) {
    const chave = merchantKey(entry.descricao);
    if (!chave) continue;
    unique.set(`${entry.tipo}|${chave}`, { chave, tipo: entry.tipo, categoryId: entry.categoryId });
  }
  if (unique.size === 0) return 0;

  await prisma.$transaction(
    [...unique.values()].map(({ chave, tipo, categoryId }) =>
      prisma.categoryMemory.upsert({
        where: { userId_chave_tipo: { userId, chave, tipo } },
        update: { categoryId },
        create: { userId, chave, tipo, categoryId },
      }),
    ),
  );
  return unique.size;
}
