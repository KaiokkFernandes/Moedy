import { Router } from "express";
import * as budgetController from "../controllers/budget.controller.js";
import { authenticate } from "../middlewares/authenticate.js";

export const budgetRoutes = Router();

budgetRoutes.use(authenticate);

budgetRoutes.get("/", budgetController.list);
budgetRoutes.get("/suggestions", budgetController.suggestions);
budgetRoutes.post("/", budgetController.create);
budgetRoutes.post("/copy", budgetController.copy);
budgetRoutes.post("/from-suggestions", budgetController.createFromSuggestions);
budgetRoutes.put("/:id", budgetController.update);
budgetRoutes.delete("/:id", budgetController.remove);
