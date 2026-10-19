import assert from "node:assert/strict";
import { describe, it } from "node:test";

process.env.DATABASE_URL ??= "postgresql://teste:teste@localhost:5432/teste";
process.env.JWT_SECRET ??= "segredo-apenas-para-os-testes-0123456789";
const { origemPermitida } = await import("./cors.js");

describe("origens permitidas", () => {
  const lista = ["https://moedy.vercel.app"];

  it("aceita as origens de CORS_ORIGIN", () => {
    assert.ok(origemPermitida("https://moedy.vercel.app", ["api.onrender.com"], lista));
  });

  it("aceita o próprio domínio do app, mesmo fora da lista", () => {
    assert.ok(origemPermitida("https://moedy-git-teste.vercel.app", ["moedy-git-teste.vercel.app"], []));
    assert.ok(origemPermitida("https://moedy.vercel.app", [undefined, "Moedy.vercel.app"], []));
    assert.ok(origemPermitida("http://localhost:3333", ["localhost:3333"], []));
  });

  it("recusa outro site", () => {
    assert.ok(!origemPermitida("https://site-malicioso.example", ["moedy.vercel.app"], lista));
    // mesmo nome com outra porta é outra origem
    assert.ok(!origemPermitida("http://localhost:5174", ["localhost:3333"], []));
  });

  it("recusa origem inválida ou \"null\"", () => {
    assert.ok(!origemPermitida("null", ["moedy.vercel.app"], []));
    assert.ok(!origemPermitida("lixo", [undefined, undefined], []));
  });
});
