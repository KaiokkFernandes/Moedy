import { Router } from "express";
import * as aiSettingsController from "../controllers/aiSettings.controller.js";
import * as onboardingController from "../controllers/onboarding.controller.js";
import { authenticate } from "../middlewares/authenticate.js";

export const settingsRoutes = Router();

settingsRoutes.use(authenticate);

settingsRoutes.get("/ai", aiSettingsController.get);
settingsRoutes.put("/ai", aiSettingsController.update);
// Tour guiado e checklist de primeiros passos (o estado atual vem junto com o usuário, em /auth/me)
settingsRoutes.put("/onboarding", onboardingController.update);
