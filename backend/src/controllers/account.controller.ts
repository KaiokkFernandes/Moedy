import type { RequestHandler } from "express";
import { accountSchema, deleteAccountQuerySchema } from "../schemas/account.schema.js";
import { idParamSchema } from "../schemas/common.schema.js";
import * as accountService from "../services/account.service.js";

export const list: RequestHandler = async (req, res) => {
  res.json(await accountService.list(req.userId));
};

export const create: RequestHandler = async (req, res) => {
  const input = accountSchema.parse(req.body);
  res.status(201).json(await accountService.create(req.userId, input));
};

export const update: RequestHandler = async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const input = accountSchema.parse(req.body);
  res.json(await accountService.update(req.userId, id, input));
};

export const remove: RequestHandler = async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const { confirm } = deleteAccountQuerySchema.parse(req.query);
  await accountService.remove(req.userId, id, confirm === "true");
  res.status(204).end();
};
