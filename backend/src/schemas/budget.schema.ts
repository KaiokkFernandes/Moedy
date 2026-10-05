import { z } from "zod";
import { MAX_CENTAVOS } from "./common.schema.js";

const mes = (nome = "O mês") => {
  const message = `${nome} deve ser um número de 1 a 12`;
  return z.coerce.number({ error: message }).int(message).min(1, message).max(12, message);
};

const ano = (nome = "O ano") => {
  const message = `${nome} deve ser um ano entre 2000 e 2100`;
  return z.coerce.number({ error: message }).int(message).min(2000, message).max(2100, message);
};

/** ?mes=&ano= — sem eles, vale o mês atual (America/Sao_Paulo). Os dois precisam vir juntos. */
export const monthQuerySchema = z
  .object({ mes: mes().optional(), ano: ano().optional() })
  .refine((query) => (query.mes === undefined) === (query.ano === undefined), {
    error: "Informe mês e ano juntos",
    path: ["mes"],
  });

export const monthSchema = z.object({ mes: mes(), ano: ano() });

export const budgetSchema = z.object({
  categoryId: z.uuid({ error: "Escolha a categoria" }),
  valorLimite: z
    .number({ error: "Informe o limite em centavos" })
    .int("O limite deve ser um número inteiro em centavos")
    .positive("O limite deve ser maior que zero")
    .max(MAX_CENTAVOS, "Limite muito alto"),
  mes: mes(),
  ano: ano(),
});

export const copyBudgetsSchema = z
  .object({
    deMes: mes("O mês de origem"),
    deAno: ano("O ano de origem"),
    paraMes: mes("O mês de destino"),
    paraAno: ano("O ano de destino"),
  })
  .refine((input) => input.deMes !== input.paraMes || input.deAno !== input.paraAno, {
    error: "O mês de destino deve ser diferente do mês de origem",
    path: ["paraMes"],
  });

export type MonthQuery = z.infer<typeof monthQuerySchema>;
export type MonthInput = z.infer<typeof monthSchema>;
export type BudgetInput = z.infer<typeof budgetSchema>;
export type CopyBudgetsInput = z.infer<typeof copyBudgetsSchema>;
