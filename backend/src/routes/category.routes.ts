import { Router } from "express";
import * as categoryController from "../controllers/category.controller.js";
import { authenticate } from "../middlewares/authenticate.js";

export const categoryRoutes = Router();

categoryRoutes.use(authenticate);

categoryRoutes.get("/", categoryController.list);
categoryRoutes.post("/", categoryController.create);
categoryRoutes.put("/:id", categoryController.update);
categoryRoutes.delete("/:id", categoryController.remove);
