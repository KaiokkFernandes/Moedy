import type { Request } from "express";
import { rateLimit } from "express-rate-limit";
import { env } from "../config/env.js";

/*
 * Limites por IP. Em produção o servidor fica atrás do proxy da hospedagem, então o IP real vem
 * de X-Forwarded-For (por isso o `trust proxy` no app). Os contadores ficam em memória: valem
 * para uma única instância e zeram quando o serviço reinicia.
 *
 * Fora de produção os limites são 100 vezes maiores, para não atrapalhar o desenvolvimento e os
 * testes automatizados sem desligar o mecanismo.
 */
const FATOR = env.NODE_ENV === "production" ? 1 : 100;
const MINUTO = 60 * 1000;

function limiter(options: {
  windowMs: number;
  limit: number;
  mensagem: string;
  skipSuccessfulRequests?: boolean;
  /** Conta por usuário logado em vez de por IP (use depois do `authenticate`). */
  porUsuario?: boolean;
}) {
  return rateLimit({
    windowMs: options.windowMs,
    limit: options.limit * FATOR,
    skipSuccessfulRequests: options.skipSuccessfulRequests,
    ...(options.porUsuario ? { keyGenerator: (req: Request) => `usuario:${req.userId}` } : {}),
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ error: options.mensagem });
    },
  });
}

/** Login: 10 tentativas erradas a cada 15 minutos. Logins certos não contam. */
export const loginLimiter = limiter({
  windowMs: 15 * MINUTO,
  limit: 10,
  skipSuccessfulRequests: true,
  mensagem: "Muitas tentativas de login. Aguarde alguns minutos e tente de novo.",
});

/** Cadastro: 5 por hora (todas as tentativas contam, para conter a criação de contas em massa). */
export const registerLimiter = limiter({
  windowMs: 60 * MINUTO,
  limit: 5,
  mensagem: "Muitas tentativas de cadastro. Tente de novo mais tarde.",
});

/**
 * Rotas que podem chamar a IA paga (leitura de extrato e sugestão de categorias): 30 a cada
 * 10 minutos por usuário. Protege a chave da API de uso abusivo por uma conta.
 */
export const aiLimiter = limiter({
  windowMs: 10 * MINUTO,
  limit: 30,
  porUsuario: true,
  mensagem: "Muitas análises em pouco tempo. Aguarde alguns minutos e tente de novo.",
});
