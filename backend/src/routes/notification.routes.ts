import { Router } from "express";
import * as notificationController from "../controllers/notification.controller.js";
import { authenticate } from "../middlewares/authenticate.js";

export const notificationRoutes = Router();

notificationRoutes.use(authenticate);

notificationRoutes.get("/", notificationController.list);
notificationRoutes.get("/unread-count", notificationController.unreadCount);
notificationRoutes.post("/read-all", notificationController.markAllRead);
notificationRoutes.patch("/:id/read", notificationController.markRead);
notificationRoutes.delete("/:id", notificationController.remove);
