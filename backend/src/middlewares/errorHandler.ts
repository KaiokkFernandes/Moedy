import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
    /** Campos extras devolvidos junto com a mensagem (ex.: quantas transações bloqueiam a exclusão). */
    public readonly details: Record<string, unknown> = {},
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
    res.status(err.statusCode).json({ error: err.message, ...err.details });
    return;
  }

  // Violação de índice único do banco (ex.: duas requisições simultâneas criando o mesmo registro)
  if (err?.code === "P2002") {
    res.status(409).json({ error: "Já existe um registro com esses dados" });
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
