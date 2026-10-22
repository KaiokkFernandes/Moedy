import assert from "node:assert/strict";
import { describe, it } from "node:test";

process.env.DATABASE_URL ??= "postgresql://teste:teste@localhost:5432/teste";
process.env.JWT_SECRET ??= "segredo-apenas-para-os-testes-0123456789";
const { dadosOnboarding } = await import("./onboarding.service.js");
const { onboardingSchema } = await import("../schemas/onboarding.schema.js");

const agora = new Date("2026-10-22T15:00:00Z");

describe("onboarding", () => {
  it("true registra o momento, false limpa (refazer)", () => {
    assert.deepEqual(dadosOnboarding({ tourConcluido: true }, agora), { onboardingTourEm: agora });
    assert.deepEqual(dadosOnboarding({ tourConcluido: false }, agora), { onboardingTourEm: null });
    assert.deepEqual(dadosOnboarding({ primeirosPassosOcultos: true }, agora), { primeirosPassosOcultosEm: agora });
  });

  it("campo ausente não é alterado", () => {
    assert.deepEqual(dadosOnboarding({ tourConcluido: true, primeirosPassosOcultos: false }, agora), {
      onboardingTourEm: agora,
      primeirosPassosOcultosEm: null,
    });
    assert.ok(!("primeirosPassosOcultosEm" in dadosOnboarding({ tourConcluido: true }, agora)));
  });

  it("validação: exige ao menos um campo, e só booleanos", () => {
    assert.ok(onboardingSchema.safeParse({ tourConcluido: true }).success);
    assert.ok(!onboardingSchema.safeParse({}).success);
    assert.ok(!onboardingSchema.safeParse({ tourConcluido: "sim" }).success);
    // Campos desconhecidos são descartados, não gravados
    assert.deepEqual(onboardingSchema.parse({ tourConcluido: true, admin: true }), { tourConcluido: true });
  });
});
