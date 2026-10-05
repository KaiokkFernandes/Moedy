import { Router } from "express";
import { accountRoutes } from "./account.routes.js";
import { authRoutes } from "./auth.routes.js";
import { categoryRoutes } from "./category.routes.js";
import { transactionRoutes } from "./transaction.routes.js";

export const routes = Router();

routes.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

routes.use("/auth", authRoutes);
routes.use("/accounts", accountRoutes);
routes.use("/categories", categoryRoutes);
routes.use("/transactions", transactionRoutes);
