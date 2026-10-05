import { z } from "zod";
import { dateSchema, transactionTypeSchema } from "./common.schema.js";

/** Parâmetros aceitos por todos os relatórios. */
const base = {
  dataInicio: dateSchema.optional(),
  dataFim: dateSchema.optional(),
  accountId: z.uuid({ error: "Conta inválida" }).optional(),
};

const validPeriod = (query: { dataInicio?: Date; dataFim?: Date }) =>
  !query.dataInicio || !query.dataFim || query.dataInicio <= query.dataFim;
const invalidPeriod = { error: "A data inicial não pode ser depois da data final", path: ["dataInicio"] };

function intParam(nome: string, min: number, max: number, padrao: number) {
  const message = `${nome} deve ser um número inteiro entre ${min} e ${max}`;
  return z.coerce.number({ error: message }).int(message).min(min, message).max(max, message).default(padrao);
}

const tipo = transactionTypeSchema.default("DESPESA");
const booleanParam = z.enum(["true", "false"], { error: "Use true ou false" }).transform((value) => value === "true");

export const periodQuerySchema = z.object(base).refine(validPeriod, invalidPeriod);
export const byCategoryQuerySchema = z.object({ ...base, tipo }).refine(validPeriod, invalidPeriod);
export const monthlyQuerySchema = z.object({ ...base, meses: intParam("meses", 1, 36, 12) }).refine(validPeriod, invalidPeriod);
export const topMerchantsQuerySchema = z.object({ ...base, tipo, limite: intParam("limite", 1, 50, 10) }).refine(validPeriod, invalidPeriod);
export const largestExpensesQuerySchema = z.object({ ...base, limite: intParam("limite", 1, 50, 5) }).refine(validPeriod, invalidPeriod);
export const recurringQuerySchema = z.object({ ...base, meses: intParam("meses", 3, 36, 12) }).refine(validPeriod, invalidPeriod);

export const categoryTrendQuerySchema = z
  .object({
    ...base,
    categoryId: z.uuid({ error: "Categoria inválida" }).optional(),
    /** Evolução das transações sem categoria (do `tipo` informado), no lugar de uma categoria. */
    semCategoria: booleanParam.optional(),
    tipo,
    meses: intParam("meses", 1, 36, 12),
  })
  .refine(validPeriod, invalidPeriod)
  .refine((query) => Boolean(query.categoryId) !== Boolean(query.semCategoria), {
    error: "Informe categoryId ou semCategoria=true",
    path: ["categoryId"],
  });

export type PeriodQuery = z.infer<typeof periodQuerySchema>;
export type ByCategoryQuery = z.infer<typeof byCategoryQuerySchema>;
export type MonthlyQuery = z.infer<typeof monthlyQuerySchema>;
export type TopMerchantsQuery = z.infer<typeof topMerchantsQuerySchema>;
export type LargestExpensesQuery = z.infer<typeof largestExpensesQuerySchema>;
export type RecurringQuery = z.infer<typeof recurringQuerySchema>;
export type CategoryTrendQuery = z.infer<typeof categoryTrendQuerySchema>;
