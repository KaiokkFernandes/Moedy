import type { ErrorRequestHandler, RequestHandler } from "express";
import { MulterError } from "multer";
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

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
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

  // Erros do upload (multer): arquivo grande demais, campo errado etc.
  if (err instanceof MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "O arquivo deve ter no máximo 5 MB"
        : "Envie um único arquivo no campo \"arquivo\"";
    res.status(400).json({ error: message });
    return;
  }

  // Violação de índice único do banco (ex.: duas requisições simultâneas criando o mesmo registro)
  if (err?.code === "P2002") {
    res.status(409).json({ error: "Já existe um registro com esses dados" });
    return;
  }

  // Corpo da requisição com JSON malformado (lançado pelo express.json)
  if (err?.type === "entity.too.large") {
    res.status(413).json({ error: "Requisição grande demais" });
    return;
  }

  if (err?.type === "entity.parse.failed") {
    res.status(400).json({ error: "JSON inválido no corpo da requisição" });
    return;
  }

  // O detalhe (mensagem e stack) vai só para o log; a resposta é genérica e traz o id da
  // requisição, para o erro poder ser localizado no log
  req.log.error({ err }, "Erro não tratado");
  res.status(500).json({ error: "Erro interno do servidor", requestId: req.id });
};
