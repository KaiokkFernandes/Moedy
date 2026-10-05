import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: `Rota não encontrada: ${req.method} ${req.originalUrl}` });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Dados inválidos",
      issues: err.issues.map((issue) => ({ campo: issue.path.join("."), mensagem: issue.message })),
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // Corpo da requisição com JSON malformado (lançado pelo express.json)
  if (err?.type === "entity.parse.failed") {
    res.status(400).json({ error: "JSON inválido no corpo da requisição" });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Erro interno do servidor" });
};
