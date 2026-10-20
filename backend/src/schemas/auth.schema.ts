import { z } from "zod";

const email = z
  .string({ error: "Informe o email" })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Email inválido" }));

export const registerSchema = z.object({
  nome: z
    .string({ error: "Informe o nome" })
    .trim()
    .min(2, "O nome deve ter pelo menos 2 caracteres")
    .max(100, "O nome deve ter no máximo 100 caracteres"),
  email,
  senha: z
    .string({ error: "Informe a senha" })
    .min(8, "A senha deve ter pelo menos 8 caracteres")
    .max(72, "A senha deve ter no máximo 72 caracteres"),
});

export const loginSchema = z.object({
  email,
  senha: z.string({ error: "Informe a senha" }).min(1, "Informe a senha"),
});

export const googleLoginSchema = z.object({
  /** ID token entregue pelo botão do Google. */
  credential: z.string({ error: "Informe o token do Google" }).min(1, "Informe o token do Google").max(4096, "Token inválido"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
