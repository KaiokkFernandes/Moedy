import "dotenv/config";
import cors from "cors";
import express from "express";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { routes } from "./routes/index.js";

const app = express();
const PORT = Number(process.env.PORT) || 3333;

app.use(cors());
app.use(express.json());

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Backend rodando em http://localhost:${PORT}`);
});
