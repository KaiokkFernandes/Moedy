import type { RequestHandler } from "express";
import { idParamSchema } from "../schemas/common.schema.js";
import { listNotificationsQuerySchema } from "../schemas/notification.schema.js";
import * as notificationService from "../services/notification.service.js";

export const list: RequestHandler = async (req, res) => {
  res.json(await notificationService.list(req.userId, listNotificationsQuerySchema.parse(req.query)));
};

export const unreadCount: RequestHandler = async (req, res) => {
  res.json(await notificationService.unreadCount(req.userId));
};

export const markRead: RequestHandler = async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  res.json(await notificationService.markRead(req.userId, id));
};

export const markAllRead: RequestHandler = async (req, res) => {
  res.json(await notificationService.markAllRead(req.userId));
};

export const remove: RequestHandler = async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  await notificationService.remove(req.userId, id);
  res.status(204).end();
};
