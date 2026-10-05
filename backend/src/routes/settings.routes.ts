import { Router } from "express";
import * as aiSettingsController from "../controllers/aiSettings.controller.js";
import { authenticate } from "../middlewares/authenticate.js";

export const settingsRoutes = Router();

settingsRoutes.use(authenticate);

settingsRoutes.get("/ai", aiSettingsController.get);
settingsRoutes.put("/ai", aiSettingsController.update);
