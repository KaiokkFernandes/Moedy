import { Router } from "express";
import * as importController from "../controllers/import.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { uploadStatement } from "../middlewares/upload.js";

export const importRoutes = Router();

importRoutes.use(authenticate);

importRoutes.post("/preview", uploadStatement, importController.preview);
importRoutes.post("/confirm", importController.confirm);
