import compression from "compression";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { blockUnknownOrigins, corsMiddleware } from "./middlewares/cors.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { routes } from "./routes/index.js";

const app = express();

// A hospedagem (Render) coloca um proxy na frente: confiar em um salto faz req.ip ser o IP do
// cliente, que é a chave dos limites de requisição
app.set("trust proxy", 1);
const PORT = env.PORT;

// Cabeçalhos de segurança. A API só devolve JSON e CSV, então a política de conteúdo é a mais
// restrita: nada pode ser carregado nem embutido a partir destas respostas.
app.use(
  helmet({
    contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
  }),
);
app.use(compression());
app.use(blockUnknownOrigins);
app.use(corsMiddleware);
// O limite maior acomoda a confirmação de uma importação com milhares de transações
app.use(express.json({ limit: "2mb" }));

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Backend rodando em http://localhost:${PORT}`);
});
