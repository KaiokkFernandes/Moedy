import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { z } from "zod";

process.env.NODE_ENV ??= "test";
process.env.DATABASE_URL ??= "postgresql://teste:teste@localhost:5432/teste";
process.env.JWT_SECRET ??= "segredo-apenas-para-os-testes-0123456789";
const { AppError, errorHandler } = await import("./errorHandler.js");

/** Executa o errorHandler com um erro e devolve o status e o corpo da resposta. */
function responder(erro: unknown) {
  const resultado = { status: 0, corpo: undefined as unknown, logado: [] as unknown[] };
  const res = {
    status(codigo: number) {
      resultado.status = codigo;
      return this;
    },
    json(corpo: unknown) {
      resultado.corpo = corpo;
      return this;
    },
  } as unknown as Response;
  const req = { id: "req-123", log: { error: (...args: unknown[]) => resultado.logado.push(args) } } as unknown as Request;
  errorHandler(erro, req, res, (() => {}) as NextFunction);
  return resultado;
}

describe("tratamento de erros da API", () => {
  it("validação (Zod): 400 com a lista de campos", () => {
    const erro = z.object({ nome: z.string({ error: "Informe o nome" }), conta: z.object({ id: z.uuid({ error: "Conta inválida" }) }) }).safeParse({ conta: { id: "x" } }).error;
    const { status, corpo } = responder(erro);
    assert.equal(status, 400);
    assert.deepEqual(corpo, {
      error: "Dados inválidos",
      issues: [
        { campo: "nome", mensagem: "Informe o nome" },
        { campo: "conta.id", mensagem: "Conta inválida" },
      ],
    });
  });

  it("AppError: status e mensagem próprios, com os detalhes extras", () => {
    assert.deepEqual(responder(new AppError("Conta tem transações", 409, { totalTransacoes: 3 })), {
      status: 409,
      corpo: { error: "Conta tem transações", totalTransacoes: 3 },
      logado: [],
    });
    assert.equal(responder(new AppError("padrão")).status, 400);
  });

  it("upload: arquivo grande demais e campo errado", () => {
    assert.deepEqual(responder(new MulterError("LIMIT_FILE_SIZE")).corpo, { error: "O arquivo deve ter no máximo 4 MB" });
    assert.deepEqual(responder(new MulterError("LIMIT_UNEXPECTED_FILE")).corpo, { error: 'Envie um único arquivo no campo "arquivo"' });
  });

  it("registro duplicado no banco (P2002): 409", () => {
    assert.deepEqual(responder(Object.assign(new Error("Unique constraint"), { code: "P2002" })), {
      status: 409,
      corpo: { error: "Já existe um registro com esses dados" },
      logado: [],
    });
  });

  it("corpo grande demais e JSON malformado", () => {
    assert.equal(responder({ type: "entity.too.large" }).status, 413);
    assert.deepEqual(responder({ type: "entity.parse.failed" }), { status: 400, corpo: { error: "JSON inválido no corpo da requisição" }, logado: [] });
  });

  it("erro inesperado: 500 genérico com o id da requisição, detalhe só no log", () => {
    const erro = new Error("senha do banco: hunter2 em /app/src/services/x.ts");
    const { status, corpo, logado } = responder(erro);
    assert.equal(status, 500);
    assert.deepEqual(corpo, { error: "Erro interno do servidor", requestId: "req-123" });
    assert.ok(!JSON.stringify(corpo).includes("hunter2"));
    assert.equal(logado.length, 1);
  });
});
