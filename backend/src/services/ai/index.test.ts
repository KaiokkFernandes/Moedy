import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AI_DEFAULT_MODEL, aiConfig } from "./config.js";
import { createCategorizer } from "./index.js";

describe("configuração da IA", () => {
  it("chave ausente: nenhum categorizador é criado (a importação segue sem IA)", () => {
    const previous = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    try {
      assert.equal(createCategorizer(), null);
    } finally {
      if (previous !== undefined) process.env.ANTHROPIC_API_KEY = previous;
    }
  });

  it("modelo padrão é o Haiku 4.5, trocável por AI_MODEL", () => {
    const previous = process.env.AI_MODEL;
    delete process.env.AI_MODEL;
    try {
      assert.equal(aiConfig().modelo, AI_DEFAULT_MODEL);
      process.env.AI_MODEL = "claude-sonnet-5-5";
      assert.equal(aiConfig().modelo, "claude-sonnet-5-5");
    } finally {
      if (previous === undefined) delete process.env.AI_MODEL;
      else process.env.AI_MODEL = previous;
    }
  });

  it("limites e tempo limite: valores inválidos caem no padrão", () => {
    const previous = { timeout: process.env.AI_TIMEOUT_MS, max: process.env.AI_MAX_TRANSACTIONS };
    process.env.AI_TIMEOUT_MS = "abc";
    process.env.AI_MAX_TRANSACTIONS = "-5";
    try {
      assert.equal(aiConfig().timeoutMs, 20_000);
      assert.equal(aiConfig().maxTransacoes, 500);
    } finally {
      process.env.AI_TIMEOUT_MS = previous.timeout ?? "";
      process.env.AI_MAX_TRANSACTIONS = previous.max ?? "";
      if (previous.timeout === undefined) delete process.env.AI_TIMEOUT_MS;
      if (previous.max === undefined) delete process.env.AI_MAX_TRANSACTIONS;
    }
  });
});
