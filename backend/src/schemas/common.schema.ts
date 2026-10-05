import { z } from "zod";

/** Limite para valores em centavos (R$ 10 milhões), bem abaixo do máximo de um Int do banco. */
export const MAX_CENTAVOS = 1_000_000_000;

export const idParamSchema = z.object({
  id: z.uuid({ error: "ID inválido" }),
});

export const transactionTypeSchema = z.enum(["DESPESA", "RECEITA"], {
  error: "O tipo deve ser DESPESA ou RECEITA",
});

/** Data no formato AAAA-MM-DD, convertida para meia-noite UTC. */
export const dateSchema = z
  .string({ error: "Informe a data" })
  .pipe(z.iso.date({ error: "Data inválida (use AAAA-MM-DD)" }))
  .transform((value) => new Date(`${value}T00:00:00.000Z`));
