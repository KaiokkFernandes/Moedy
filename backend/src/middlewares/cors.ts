import cors from "cors";
import type { Request, RequestHandler } from "express";
import { env } from "../config/env.js";

/**
 * A origem pode chamar a API quando é o próprio endereço do app (frontend e API no mesmo
 * domínio, como na Vercel: aí nem é uma chamada entre origens) ou quando está em CORS_ORIGIN.
 * Os cabeçalhos de host vêm do servidor ou da plataforma; uma página de outro site não
 * consegue alterá-los numa requisição feita pelo navegador.
 */
export function origemPermitida(origin: string, hosts: (string | undefined)[], lista: string[]): boolean {
  if (lista.includes(origin)) return true;
  let host: string;
  try {
    host = new URL(origin).host;
  } catch {
    return false;
  }
  return hosts.some((candidato) => candidato?.split(",")[0].trim().toLowerCase() === host.toLowerCase());
}

function hostsDaRequisicao(req: Request) {
  return [req.headers.host, req.get("x-forwarded-host")];
}

/**
 * Só as origens permitidas recebem os cabeçalhos de CORS. O frontend autentica pelo cabeçalho
 * Authorization (não por cookie), então `credentials` fica desligado.
 */
export const corsMiddleware = cors((req, callback) => {
  const origin = req.headers.origin;
  callback(null, {
    origin: origin ? origemPermitida(origin, hostsDaRequisicao(req as Request), env.CORS_ORIGINS) : false,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    // O frontend lê o nome do arquivo do CSV exportado neste cabeçalho
    exposedHeaders: ["Content-Disposition"],
    maxAge: 600,
  });
});

/**
 * O CORS sozinho só impede o navegador de ler a resposta; a requisição ainda seria processada.
 * Aqui, uma origem não permitida é recusada antes de chegar às rotas. Chamadas sem o cabeçalho
 * Origin (health check, curl, servidor a servidor) seguem normalmente.
 */
export const blockUnknownOrigins: RequestHandler = (req, res, next) => {
  const origin = req.headers.origin;
  if (origin && !origemPermitida(origin, hostsDaRequisicao(req), env.CORS_ORIGINS)) {
    res.status(403).json({ error: "Origem não permitida" });
    return;
  }
  next();
};
