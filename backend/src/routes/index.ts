import { Router } from "express";
import { accountRoutes } from "./account.routes.js";
import { authRoutes } from "./auth.routes.js";
import { budgetRoutes } from "./budget.routes.js";
import { categoryRoutes } from "./category.routes.js";
import { categoryRuleRoutes } from "./categoryRule.routes.js";
import { importRoutes } from "./import.routes.js";
import { notificationRoutes } from "./notification.routes.js";
import { reportRoutes } from "./report.routes.js";
import { transactionRoutes } from "./transaction.routes.js";

export const routes = Router();

routes.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

routes.use("/auth", authRoutes);
routes.use("/accounts", accountRoutes);
routes.use("/categories", categoryRoutes);
routes.use("/transactions", transactionRoutes);
routes.use("/category-rules", categoryRuleRoutes);
routes.use("/import", importRoutes);
routes.use("/reports", reportRoutes);
routes.use("/budgets", budgetRoutes);
routes.use("/notifications", notificationRoutes);
