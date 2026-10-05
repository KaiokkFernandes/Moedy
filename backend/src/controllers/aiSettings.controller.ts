import type { RequestHandler } from "express";
import { z } from "zod";
import * as aiSettingsService from "../services/aiSettings.service.js";

const updateSchema = z.object({
  usarIaImportacao: z.boolean({ error: "Informe true ou false" }),
  confirmaEnvioAnthropic: z.boolean({ error: "Use true ou false" }).optional(),
});

export const get: RequestHandler = async (req, res) => {
  res.json(await aiSettingsService.getAiSettings(req.userId));
};

export const update: RequestHandler = async (req, res) => {
  res.json(await aiSettingsService.updateAiSettings(req.userId, updateSchema.parse(req.body)));
};
