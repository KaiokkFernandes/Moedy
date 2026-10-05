import type { RequestHandler } from "express";
import { budgetSchema, copyBudgetsSchema, monthQuerySchema, monthSchema } from "../schemas/budget.schema.js";
import { idParamSchema } from "../schemas/common.schema.js";
import * as budgetService from "../services/budget.service.js";

export const list: RequestHandler = async (req, res) => {
  res.json(await budgetService.list(req.userId, monthQuerySchema.parse(req.query)));
};

export const suggestions: RequestHandler = async (req, res) => {
  res.json(await budgetService.suggestions(req.userId, monthQuerySchema.parse(req.query)));
};

export const create: RequestHandler = async (req, res) => {
  res.status(201).json(await budgetService.create(req.userId, budgetSchema.parse(req.body)));
};

export const update: RequestHandler = async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  res.json(await budgetService.update(req.userId, id, budgetSchema.parse(req.body)));
};

export const remove: RequestHandler = async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  await budgetService.remove(req.userId, id);
  res.status(204).end();
};

export const copy: RequestHandler = async (req, res) => {
  res.json(await budgetService.copy(req.userId, copyBudgetsSchema.parse(req.body)));
};

export const createFromSuggestions: RequestHandler = async (req, res) => {
  res.status(201).json(await budgetService.createFromSuggestions(req.userId, monthSchema.parse(req.body)));
};
