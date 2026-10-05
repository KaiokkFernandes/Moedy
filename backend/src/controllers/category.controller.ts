import type { RequestHandler } from "express";
import { categorySchema, listCategoriesQuerySchema } from "../schemas/category.schema.js";
import { idParamSchema } from "../schemas/common.schema.js";
import * as categoryService from "../services/category.service.js";

export const list: RequestHandler = async (req, res) => {
  const { tipo } = listCategoriesQuerySchema.parse(req.query);
  res.json(await categoryService.list(req.userId, tipo));
};

export const create: RequestHandler = async (req, res) => {
  const input = categorySchema.parse(req.body);
  res.status(201).json(await categoryService.create(req.userId, input));
};

export const update: RequestHandler = async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const input = categorySchema.parse(req.body);
  res.json(await categoryService.update(req.userId, id, input));
};

export const remove: RequestHandler = async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  await categoryService.remove(req.userId, id);
  res.status(204).end();
};
