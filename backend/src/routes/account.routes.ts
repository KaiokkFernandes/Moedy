import { Router } from "express";
import * as accountController from "../controllers/account.controller.js";
import { authenticate } from "../middlewares/authenticate.js";

export const accountRoutes = Router();

accountRoutes.use(authenticate);

accountRoutes.get("/", accountController.list);
accountRoutes.post("/", accountController.create);
accountRoutes.put("/:id", accountController.update);
accountRoutes.delete("/:id", accountController.remove);
