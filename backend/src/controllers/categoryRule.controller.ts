import type { RequestHandler } from "express";
import { categoryRuleSchema } from "../schemas/categoryRule.schema.js";
import { idParamSchema } from "../schemas/common.schema.js";
import { checkAlertsSafely } from "../services/alert.service.js";
import * as categoryRuleService from "../services/categoryRule.service.js";

export const list: RequestHandler = async (req, res) => {
  res.json(await categoryRuleService.list(req.userId));
};

export const create: RequestHandler = async (req, res) => {
  const input = categoryRuleSchema.parse(req.body);
  res.status(201).json(await categoryRuleService.create(req.userId, input));
};

export const update: RequestHandler = async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const input = categoryRuleSchema.parse(req.body);
  res.json(await categoryRuleService.update(req.userId, id, input));
};

export const remove: RequestHandler = async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  await categoryRuleService.remove(req.userId, id);
  res.status(204).end();
};

export const apply: RequestHandler = async (req, res) => {
  const result = await categoryRuleService.applyToUncategorized(req.userId);
  if (result.categorizadas > 0) await checkAlertsSafely(req.userId);
  res.json(result);
};
