import { Router } from "express";
import { accountRoutes } from "./account.routes.js";
import { authRoutes } from "./auth.routes.js";
import { budgetRoutes } from "./budget.routes.js";
import { categoryRoutes } from "./category.routes.js";
import { categoryRuleRoutes } from "./categoryRule.routes.js";
import { prisma } from "../lib/prisma.js";
import { generalLimiter } from "../middlewares/rateLimit.js";
import { importRoutes } from "./import.routes.js";
import { notificationRoutes } from "./notification.routes.js";
import { reportRoutes } from "./report.routes.js";
import { settingsRoutes } from "./settings.routes.js";
import { transactionRoutes } from "./transaction.routes.js";

export const routes = Router();

/** Saúde do serviço, incluindo o banco: 503 quando a consulta de teste falha. */
routes.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok" });
  } catch (erro) {
    req.log.error({ err: erro }, "Verificação de saúde: banco inacessível");
    res.status(503).json({ status: "indisponivel", error: "Banco de dados inacessível" });
  }
});

// A verificação de saúde fica antes do limite geral: o monitor da hospedagem a chama o tempo todo
routes.use(generalLimiter);

routes.use("/auth", authRoutes);
routes.use("/accounts", accountRoutes);
routes.use("/categories", categoryRoutes);
routes.use("/transactions", transactionRoutes);
routes.use("/category-rules", categoryRuleRoutes);
routes.use("/import", importRoutes);
routes.use("/reports", reportRoutes);
routes.use("/budgets", budgetRoutes);
routes.use("/notifications", notificationRoutes);
routes.use("/settings", settingsRoutes);
