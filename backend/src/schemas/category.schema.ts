import { z } from "zod";
import { transactionTypeSchema } from "./common.schema.js";

export const categorySchema = z.object({
  nome: z
    .string({ error: "Informe o nome da categoria" })
    .trim()
    .min(1, "Informe o nome da categoria")
    .max(40, "O nome deve ter no máximo 40 caracteres"),
  cor: z
    .string({ error: "Informe a cor" })
    .regex(/^#[0-9a-fA-F]{6}$/, "A cor deve estar no formato #RRGGBB")
    .toLowerCase(),
  icone: z
    .string({ error: "Informe o ícone" })
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Ícone inválido")
    .max(40, "Ícone inválido"),
  tipo: transactionTypeSchema,
});

export const listCategoriesQuerySchema = z.object({
  tipo: transactionTypeSchema.optional(),
});

export type CategoryInput = z.infer<typeof categorySchema>;
