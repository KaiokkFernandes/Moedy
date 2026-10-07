import { randomUUID } from "node:crypto";
import { pino } from "pino";
import { pinoHttp } from "pino-http";
import { env } from "../config/env.js";

const NIVEL_PADRAO = { production: "info", development: "debug", test: "silent" } as const;

/**
 * Log estruturado (JSON em produção, legível no terminal em desenvolvimento).
 * Nunca registra senha, token, chave de API nem conteúdo de extrato: os cabeçalhos sensíveis
 * são ocultados e o corpo das requisições não é logado.
 */
export const logger = pino({
  level: env.LOG_LEVEL ?? NIVEL_PADRAO[env.NODE_ENV],
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie", "*.senha", "*.token", "*.apiKey"],
    censor: "[oculto]",
  },
  ...(env.NODE_ENV === "development"
    ? { transport: { target: "pino-pretty", options: { colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname" } } }
    : {}),
});

/** Uma linha de log por requisição, com um id que também volta no cabeçalho X-Request-Id. */
export const httpLogger = pinoHttp({
  logger,
  genReqId: (_req, res) => {
    const id = randomUUID();
    res.setHeader("X-Request-Id", id);
    return id;
  },
  // A verificação de saúde é chamada o tempo todo pelo monitor da hospedagem
  autoLogging: { ignore: (req) => req.url === "/api/health" },
  customLogLevel: (_req, res, err) => (err || res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info"),
  serializers: {
    // Só método e caminho: a query string pode trazer texto digitado pelo usuário (busca)
    req: (req) => ({ id: req.id, method: req.method, url: String(req.url).split("?")[0] }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
});
