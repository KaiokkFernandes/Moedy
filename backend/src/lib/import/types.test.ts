import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildTransaction, createHashIdGenerator, isValidDate } from "./types.js";

describe("validação de datas da importação", () => {
  it("aceita dias que existem e recusa os que não existem", () => {
    assert.ok(isValidDate("2026-10-31"));
    assert.ok(isValidDate("2028-02-29"));
    assert.ok(!isValidDate("2026-02-29"));
    assert.ok(!isValidDate("2026-02-31"));
    assert.ok(!isValidDate("2026-13-01"));
    assert.ok(!isValidDate("31/10/2026"));
    assert.ok(!isValidDate(""));
  });
});

describe("montagem da transação", () => {
  it("o sinal vira o tipo e o valor fica positivo", () => {
    assert.deepEqual(buildTransaction(2, "2026-10-01", "Mercado", -3549, "id1"), {
      linha: 2,
      data: "2026-10-01",
      descricao: "Mercado",
      valor: 3549,
      tipo: "DESPESA",
      externalId: "id1",
    });
    assert.equal(buildTransaction(3, "2026-10-01", "Salário", 650000, "id2").tipo, "RECEITA");
  });

  it("limpa espaços, limita o tamanho e nunca deixa a descrição vazia", () => {
    assert.equal(buildTransaction(1, "2026-10-01", "  PIX   enviado \n Zé ", 100, "x").descricao, "PIX enviado Zé");
    assert.equal(buildTransaction(1, "2026-10-01", "   ", 100, "x").descricao, "Sem descrição");
    assert.equal(buildTransaction(1, "2026-10-01", "a".repeat(300), 100, "x").descricao.length, 140);
  });

  it("recusa valor zero e acima de R$ 10 milhões", () => {
    assert.throws(() => buildTransaction(1, "2026-10-01", "x", 0, "x"), /valor zero/);
    assert.throws(() => buildTransaction(1, "2026-10-01", "x", -1_000_000_001, "x"), /acima do limite/);
    assert.equal(buildTransaction(1, "2026-10-01", "x", 1_000_000_000, "x").valor, 1_000_000_000);
  });
});

describe("IDs para lançamentos sem identificador", () => {
  it("reimportar o mesmo arquivo gera os mesmos IDs", () => {
    const primeira = createHashIdGenerator("csv");
    const segunda = createHashIdGenerator("csv");
    assert.equal(primeira("2026-10-02", -1890, "UBER *TRIP"), segunda("2026-10-02", -1890, "UBER *TRIP"));
  });

  it("duas compras idênticas no mesmo dia continuam distintas", () => {
    const gerar = createHashIdGenerator("csv");
    const a = gerar("2026-10-02", -1890, "UBER *TRIP");
    const b = gerar("2026-10-02", -1890, "UBER *TRIP");
    assert.notEqual(a, b);
  });

  it("diferenças só de caixa e acento não mudam o ID", () => {
    assert.equal(createHashIdGenerator("csv")("2026-10-02", -500, "Café"), createHashIdGenerator("csv")("2026-10-02", -500, "  CAFE "));
  });

  it("valor, data ou prefixo diferentes mudam o ID", () => {
    const id = (prefixo: string, data: string, valor: number) => createHashIdGenerator(prefixo)(data, valor, "Loja");
    const base = id("csv", "2026-10-02", -500);
    assert.match(base, /^csv-[0-9a-f]{32}$/);
    assert.notEqual(base, id("csv", "2026-10-03", -500));
    assert.notEqual(base, id("csv", "2026-10-02", 500));
    assert.notEqual(base, id("ofx", "2026-10-02", -500));
  });
});
