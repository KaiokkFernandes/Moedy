import { Router } from "express";
import * as transactionController from "../controllers/transaction.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { aiLimiter } from "../middlewares/rateLimit.js";

export const transactionRoutes = Router();

transactionRoutes.use(authenticate);

transactionRoutes.get("/", transactionController.list);
transactionRoutes.post("/", transactionController.create);
transactionRoutes.post("/suggest-categories", aiLimiter, transactionController.suggestCategories);
transactionRoutes.put("/:id", transactionController.update);
transactionRoutes.delete("/:id", transactionController.remove);
transactionRoutes.patch("/:id/category", transactionController.updateCategory);
