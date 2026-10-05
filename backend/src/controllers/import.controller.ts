import type { RequestHandler } from "express";
import { AppError } from "../middlewares/errorHandler.js";
import { confirmSchema, previewSchema } from "../schemas/import.schema.js";
import * as importService from "../services/import.service.js";

export const preview: RequestHandler = async (req, res) => {
  if (!req.file) {
    throw new AppError("Envie o arquivo do extrato (.ofx ou .csv) no campo \"arquivo\"", 400);
  }
  const { accountId, mapeamento } = previewSchema.parse(req.body);
  res.json(await importService.preview(req.userId, accountId, req.file, mapeamento));
};

export const confirm: RequestHandler = async (req, res) => {
  const input = confirmSchema.parse(req.body);
  res.json(await importService.confirm(req.userId, input));
};
