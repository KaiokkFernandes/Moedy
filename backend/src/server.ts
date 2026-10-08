import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { prisma } from "./lib/prisma.js";

/** Tempo máximo para as requisições em andamento terminarem antes de forçar a saída. */
const SHUTDOWN_TIMEOUT_MS = 10_000;

const app = createApp();

// 0.0.0.0: dentro de um container, escutar só em localhost deixaria o serviço inacessível
const server = app.listen(env.PORT, "0.0.0.0", () => {
  logger.info({ porta: env.PORT, ambiente: env.NODE_ENV }, "Backend no ar");
});

let encerrando = false;

/**
 * Encerramento limpo: para de aceitar conexões, espera as requisições em andamento terminarem
 * e fecha a conexão com o banco. A hospedagem envia SIGTERM a cada nova publicação.
 */
function encerrar(sinal: string) {
  if (encerrando) return;
  encerrando = true;
  logger.info({ sinal }, "Encerrando: aguardando as requisições em andamento");

  const limite = setTimeout(() => {
    logger.error("Encerramento demorou demais; saindo à força");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  limite.unref();

  server.close(async (erro) => {
    try {
      await prisma.$disconnect();
    } catch (falha) {
      logger.error({ err: falha }, "Falha ao desconectar do banco");
    }
    if (erro) logger.error({ err: erro }, "Falha ao fechar o servidor");
    else logger.info("Encerrado");
    process.exit(erro ? 1 : 0);
  });
  // Conexões keep-alive paradas não têm nada a terminar
  server.closeIdleConnections();
}

process.on("SIGTERM", () => encerrar("SIGTERM"));
process.on("SIGINT", () => encerrar("SIGINT"));

// Um erro fora de qualquer requisição deixa o processo em estado incerto: registra e sai, e a
// hospedagem reinicia o serviço
process.on("unhandledRejection", (motivo) => {
  logger.fatal({ err: motivo }, "Promise rejeitada sem tratamento");
  process.exit(1);
});
process.on("uncaughtException", (erro) => {
  logger.fatal({ err: erro }, "Exceção não capturada");
  process.exit(1);
});
