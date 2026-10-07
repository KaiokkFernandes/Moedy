import cors from "cors";
import type { RequestHandler } from "express";
import { env } from "../config/env.js";

/**
 * Só as origens de CORS_ORIGIN podem chamar a API pelo navegador. O frontend autentica pelo
 * cabeçalho Authorization (não por cookie), então `credentials` fica desligado.
 */
export const corsMiddleware = cors({
  origin: env.CORS_ORIGINS,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  // O frontend lê o nome do arquivo do CSV exportado neste cabeçalho
  exposedHeaders: ["Content-Disposition"],
  maxAge: 600,
});

/**
 * O CORS sozinho só impede o navegador de ler a resposta; a requisição ainda seria processada.
 * Aqui, uma origem fora da lista é recusada antes de chegar às rotas. Chamadas sem o cabeçalho
 * Origin (health check, curl, servidor a servidor) seguem normalmente.
 */
export const blockUnknownOrigins: RequestHandler = (req, res, next) => {
  const origin = req.headers.origin;
  if (origin && !env.CORS_ORIGINS.includes(origin)) {
    res.status(403).json({ error: "Origem não permitida" });
    return;
  }
  next();
};
