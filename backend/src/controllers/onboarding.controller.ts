import type { RequestHandler } from "express";
import { onboardingSchema } from "../schemas/onboarding.schema.js";
import * as onboardingService from "../services/onboarding.service.js";

export const update: RequestHandler = async (req, res) => {
  res.json(await onboardingService.atualizarOnboarding(req.userId, onboardingSchema.parse(req.body)));
};
