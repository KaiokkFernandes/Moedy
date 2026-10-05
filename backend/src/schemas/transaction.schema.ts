import { z } from "zod";
import { dateSchema, MAX_CENTAVOS, transactionTypeSchema } from "./common.schema.js";

const categoryId = z.uuid({ error: "Categoria inválida" }).nullable();

export const transactionSchema = z.object({
  accountId: z.uuid({ error: "Informe a conta" }),
  categoryId: categoryId.default(null),
  descricao: z
    .string({ error: "Informe a descrição" })
    .trim()
    .min(1, "Informe a descrição")
    .max(140, "A descrição deve ter no máximo 140 caracteres"),
  valor: z
    .number({ error: "Informe o valor em centavos" })
    .int("O valor deve ser um número inteiro em centavos")
    .positive("O valor deve ser maior que zero")
    .max(MAX_CENTAVOS, "Valor muito alto"),
  data: dateSchema,
  tipo: transactionTypeSchema,
});

export const transactionCategorySchema = z.object({
  categoryId,
});

const booleanParam = z
  .enum(["true", "false"], { error: "Use true ou false" })
  .transform((value) => value === "true");

export const listTransactionsQuerySchema = z.object({
  dataInicio: dateSchema.optional(),
  dataFim: dateSchema.optional(),
  accountId: z.uuid({ error: "Conta inválida" }).optional(),
  categoryId: z.uuid({ error: "Categoria inválida" }).optional(),
  tipo: transactionTypeSchema.optional(),
  busca: z.string().trim().max(140).optional(),
  semCategoria: booleanParam.optional(),
  page: z.coerce.number({ error: "Página inválida" }).int("Página inválida").min(1, "Página inválida").default(1),
  pageSize: z.coerce
    .number({ error: "Tamanho de página inválido" })
    .int("Tamanho de página inválido")
    .min(1, "Tamanho de página inválido")
    .max(100, "O tamanho máximo da página é 100")
    .default(20),
});

export type TransactionInput = z.infer<typeof transactionSchema>;
export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;
