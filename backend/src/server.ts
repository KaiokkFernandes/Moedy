import "dotenv/config";
import cors from "cors";
import express from "express";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";

const app = express();
const PORT = Number(process.env.PORT) || 3333;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Backend rodando em http://localhost:${PORT}`);
});
