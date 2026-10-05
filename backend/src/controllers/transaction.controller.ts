import type { RequestHandler } from "express";
import { idParamSchema } from "../schemas/common.schema.js";
import {
  listTransactionsQuerySchema,
  suggestCategoriesQuerySchema,
  transactionCategorySchema,
  transactionSchema,
} from "../schemas/transaction.schema.js";
import { checkAlertsSafely } from "../services/alert.service.js";
import * as transactionService from "../services/transaction.service.js";

export const list: RequestHandler = async (req, res) => {
  const query = listTransactionsQuerySchema.parse(req.query);
  res.json(await transactionService.list(req.userId, query));
};

export const create: RequestHandler = async (req, res) => {
  const input = transactionSchema.parse(req.body);
  const transaction = await transactionService.create(req.userId, input);
  await checkAlertsSafely(req.userId, [transaction.id]);
  res.status(201).json(transaction);
};

export const update: RequestHandler = async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const input = transactionSchema.parse(req.body);
  const transaction = await transactionService.update(req.userId, id, input);
  await checkAlertsSafely(req.userId, [transaction.id]);
  res.json(transaction);
};

export const updateCategory: RequestHandler = async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const { categoryId, origem } = transactionCategorySchema.parse(req.body);
  const transaction = await transactionService.updateCategory(req.userId, id, categoryId, origem);
  await checkAlertsSafely(req.userId, [transaction.id]);
  res.json(transaction);
};

export const suggestCategories: RequestHandler = async (req, res) => {
  const query = suggestCategoriesQuerySchema.parse(req.body ?? {});
  res.json(await transactionService.suggestForUncategorized(req.userId, query));
};

export const remove: RequestHandler = async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  await transactionService.remove(req.userId, id);
  res.status(204).end();
};
