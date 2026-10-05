import type { RequestHandler } from "express";
import { AppError } from "../middlewares/errorHandler.js";
import { confirmSchema, previewSchema } from "../schemas/import.schema.js";
import { checkAlertsSafely } from "../services/alert.service.js";
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
  const { ids, ...result } = await importService.confirm(req.userId, input);

  // Uma única verificação no final (não a cada linha). Se ela falhar, a importação já está gravada
  // e é concluída normalmente, só sem os alertas.
  const alertas = ids.length > 0 ? await checkAlertsSafely(req.userId, ids) : 0;

  res.json({ ...result, alertas });
};
