import compression from "compression";
import express from "express";
import helmet from "helmet";
import { httpLogger } from "./lib/logger.js";
import { blockUnknownOrigins, corsMiddleware } from "./middlewares/cors.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { routes } from "./routes/index.js";

/** Monta o app Express, sem abrir porta (quem escuta é o server.ts). */
export function createApp() {
  const app = express();

  // A hospedagem (Vercel) coloca um proxy na frente: confiar em um salto faz req.ip ser o IP do
  // cliente, que é a chave dos limites de requisição
  app.set("trust proxy", 1);

  app.use(httpLogger);
  // Cabeçalhos de segurança. A API só devolve JSON e CSV, então a política de conteúdo é a mais
  // restrita: nada pode ser carregado nem embutido a partir destas respostas.
  app.use(
    helmet({
      contentSecurityPolicy: { useDefaults: false, directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
    }),
  );
  app.use(compression());
  app.use(blockUnknownOrigins);
  app.use(corsMiddleware);
  // 2 MB acomodam a confirmação de uma importação com milhares de transações; acima disso, 413
  app.use(express.json({ limit: "2mb" }));

  app.use("/api", routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
