import { Router } from "express";
import * as reportController from "../controllers/report.controller.js";
import { authenticate } from "../middlewares/authenticate.js";

export const reportRoutes = Router();

reportRoutes.use(authenticate);

reportRoutes.get("/summary", reportController.summary);
reportRoutes.get("/by-category", reportController.byCategory);
reportRoutes.get("/monthly", reportController.monthly);
reportRoutes.get("/daily", reportController.daily);
reportRoutes.get("/top-merchants", reportController.topMerchants);
reportRoutes.get("/largest-expenses", reportController.largestExpenses);
reportRoutes.get("/recurring", reportController.recurring);
reportRoutes.get("/category-trend", reportController.categoryTrend);
reportRoutes.get("/export", reportController.exportCsv);
