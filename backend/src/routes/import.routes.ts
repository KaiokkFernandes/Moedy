import { Router } from "express";
import * as importController from "../controllers/import.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { aiLimiter } from "../middlewares/rateLimit.js";
import { uploadStatement } from "../middlewares/upload.js";

export const importRoutes = Router();

importRoutes.use(authenticate);

importRoutes.post("/preview", aiLimiter, uploadStatement, importController.preview);
importRoutes.post("/confirm", importController.confirm);
