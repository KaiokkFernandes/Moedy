import { z } from "zod";

export const categoryRuleSchema = z.object({
  palavraChave: z
    .string({ error: "Informe a palavra-chave" })
    .trim()
    .min(2, "A palavra-chave deve ter pelo menos 2 caracteres")
    .max(60, "A palavra-chave deve ter no máximo 60 caracteres"),
  categoryId: z.uuid({ error: "Escolha a categoria" }),
});

export type CategoryRuleInput = z.infer<typeof categoryRuleSchema>;
