import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { loginLimiter, registerLimiter } from "../middlewares/rateLimit.js";

export const authRoutes = Router();

// Público: o frontend usa para saber se mostra o link de cadastro
authRoutes.get("/config", authController.config);
authRoutes.post("/register", registerLimiter, authController.requireRegistrationEnabled, authController.register);
authRoutes.post("/login", loginLimiter, authController.login);
authRoutes.get("/me", authenticate, authController.me);
