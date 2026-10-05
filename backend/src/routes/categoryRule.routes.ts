import { Router } from "express";
import * as categoryRuleController from "../controllers/categoryRule.controller.js";
import { authenticate } from "../middlewares/authenticate.js";

export const categoryRuleRoutes = Router();

categoryRuleRoutes.use(authenticate);

categoryRuleRoutes.get("/", categoryRuleController.list);
categoryRuleRoutes.post("/", categoryRuleController.create);
categoryRuleRoutes.post("/apply", categoryRuleController.apply);
categoryRuleRoutes.put("/:id", categoryRuleController.update);
categoryRuleRoutes.delete("/:id", categoryRuleController.remove);
