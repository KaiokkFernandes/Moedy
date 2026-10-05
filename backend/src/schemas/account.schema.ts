import { z } from "zod";
import { MAX_CENTAVOS } from "./common.schema.js";

export const accountSchema = z.object({
  nome: z
    .string({ error: "Informe o nome da conta" })
    .trim()
    .min(1, "Informe o nome da conta")
    .max(60, "O nome deve ter no máximo 60 caracteres"),
  tipo: z.enum(["CORRENTE", "POUPANCA", "CARTAO", "DINHEIRO"], {
    error: "O tipo deve ser CORRENTE, POUPANCA, CARTAO ou DINHEIRO",
  }),
  saldoInicial: z
    .number({ error: "Informe o saldo inicial em centavos" })
    .int("O saldo inicial deve ser um valor inteiro em centavos")
    .min(-MAX_CENTAVOS, "Saldo inicial muito baixo")
    .max(MAX_CENTAVOS, "Saldo inicial muito alto")
    .default(0),
});

export const deleteAccountQuerySchema = z.object({
  confirm: z.string().optional(),
});

export type AccountInput = z.infer<typeof accountSchema>;
