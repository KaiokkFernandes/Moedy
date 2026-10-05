import type { RequestHandler } from "express";
import { idParamSchema } from "../schemas/common.schema.js";
import {
  listTransactionsQuerySchema,
  transactionCategorySchema,
  transactionSchema,
} from "../schemas/transaction.schema.js";
import * as transactionService from "../services/transaction.service.js";

export const list: RequestHandler = async (req, res) => {
  const query = listTransactionsQuerySchema.parse(req.query);
  res.json(await transactionService.list(req.userId, query));
};

export const create: RequestHandler = async (req, res) => {
  const input = transactionSchema.parse(req.body);
  res.status(201).json(await transactionService.create(req.userId, input));
};

export const update: RequestHandler = async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const input = transactionSchema.parse(req.body);
  res.json(await transactionService.update(req.userId, id, input));
};

export const updateCategory: RequestHandler = async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const { categoryId } = transactionCategorySchema.parse(req.body);
  res.json(await transactionService.updateCategory(req.userId, id, categoryId));
};

export const remove: RequestHandler = async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  await transactionService.remove(req.userId, id);
  res.status(204).end();
};
