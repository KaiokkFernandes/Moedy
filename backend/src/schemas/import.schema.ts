import { z } from "zod";
import { dateSchema, MAX_CENTAVOS, transactionTypeSchema } from "./common.schema.js";

const column = z.number({ error: "Coluna inválida" }).int("Coluna inválida").min(0, "Coluna inválida");

const mappingSchema = z
  .object({
    data: column,
    descricao: column,
    valor: column.optional(),
    entrada: column.optional(),
    saida: column.optional(),
  })
  .refine(
    (mapping) =>
      mapping.valor !== undefined
        ? mapping.entrada === undefined && mapping.saida === undefined
        : mapping.entrada !== undefined || mapping.saida !== undefined,
    { error: "Informe a coluna de valor, ou as colunas de entrada e saída" },
  );

/** Campos de texto que acompanham o arquivo no multipart. */
export const previewSchema = z.object({
  accountId: z.uuid({ error: "Informe a conta de destino" }),
  /** Só para CSV: mapeamento das colunas, enviado como JSON. Sem ele, o preview devolve as colunas para mapear. */
  mapeamento: z
    .string()
    .transform((value, ctx) => {
      try {
        return JSON.parse(value) as unknown;
      } catch {
        ctx.addIssue({ code: "custom", message: "Mapeamento inválido" });
        return z.NEVER;
      }
    })
    .pipe(mappingSchema)
    .optional(),
});

/** Limite de lançamentos por importação. */
export const MAX_IMPORT_ITEMS = 5000;

export const confirmSchema = z.object({
  accountId: z.uuid({ error: "Informe a conta de destino" }),
  itens: z
    .array(
      z.object({
        data: dateSchema,
        descricao: z.string({ error: "Informe a descrição" }).trim().min(1, "Informe a descrição").max(140, "Descrição muito longa"),
        valor: z
          .number({ error: "Informe o valor em centavos" })
          .int("O valor deve ser um número inteiro em centavos")
          .positive("O valor deve ser maior que zero")
          .max(MAX_CENTAVOS, "Valor muito alto"),
        tipo: transactionTypeSchema,
        externalId: z.string({ error: "Informe o externalId" }).min(1, "Informe o externalId").max(200, "externalId muito longo"),
        categoryId: z.uuid({ error: "Categoria inválida" }).nullable().default(null),
      }),
      { error: "Informe a lista de transações" },
    )
    .min(1, "Nenhuma transação para importar")
    .max(MAX_IMPORT_ITEMS, `Importe no máximo ${MAX_IMPORT_ITEMS} transações por vez`),
});

export type CsvMappingInput = z.infer<typeof mappingSchema>;
export type ConfirmInput = z.infer<typeof confirmSchema>;
