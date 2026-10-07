import express from "express";
import { env } from "./config/env.js";
import { blockUnknownOrigins, corsMiddleware } from "./middlewares/cors.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { routes } from "./routes/index.js";

const app = express();
const PORT = env.PORT;

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
