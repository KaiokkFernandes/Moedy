import assert from "node:assert/strict";
import { describe, it } from "node:test";

// O módulo valida process.env ao ser importado; os testes usam a função pura
process.env.DATABASE_URL ??= "postgresql://teste:teste@localhost:5432/teste";
process.env.JWT_SECRET ??= "segredo-apenas-para-os-testes-0123456789";
const { EnvError, parseEnv } = await import("./env.js");

const base = {
  DATABASE_URL: "postgresql://u:s@localhost:5432/banco",
  JWT_SECRET: "a".repeat(32),
};

const problemas = (source: Record<string, string | undefined>) => {
  try {
    parseEnv(source);
    return [];
  } catch (erro) {
    assert.ok(erro instanceof EnvError);
    return erro.problemas;
  }
};

describe("variáveis de ambiente", () => {
  it("mínimo válido em desenvolvimento, com os padrões", () => {
    const env = parseEnv(base);
    assert.equal(env.NODE_ENV, "development");
    assert.equal(env.PORT, 3333);
    assert.equal(env.REGISTRATION_ENABLED, true);
    assert.deepEqual(env.CORS_ORIGINS, ["http://localhost:5173"]);
  });

  it("sem DATABASE_URL ou JWT_SECRET: erro citando a variável", () => {
    assert.match(problemas({ JWT_SECRET: base.JWT_SECRET }).join(), /DATABASE_URL: obrigatória/);
    assert.match(problemas({ DATABASE_URL: base.DATABASE_URL }).join(), /JWT_SECRET: obrigatória/);
  });

  it("variável vazia conta como ausente", () => {
    assert.match(problemas({ ...base, JWT_SECRET: "" }).join(), /JWT_SECRET: obrigatória/);
  });

  it("JWT_SECRET com menos de 32 caracteres é recusado, sem mostrar o valor", () => {
    const erros = problemas({ ...base, JWT_SECRET: "curto-demais-123" }).join();
    assert.match(erros, /JWT_SECRET: deve ter pelo menos 32 caracteres/);
    assert.doesNotMatch(erros, /curto-demais/);
  });

  it("DATABASE_URL que não é do PostgreSQL é recusada", () => {
    assert.match(problemas({ ...base, DATABASE_URL: "file:./dev.db" }).join(), /DATABASE_URL: deve ser uma URL do PostgreSQL/);
  });

  it("produção recusa o segredo de exemplo", () => {
    const erros = problemas({ ...base, NODE_ENV: "production", JWT_SECRET: "troque-por-um-segredo-com-pelo-menos-32-caracteres" }).join();
    assert.match(erros, /JWT_SECRET: é o valor de exemplo/);
  });

  it("produção sem CORS_ORIGIN aceita só o próprio domínio (lista vazia)", () => {
    assert.deepEqual(parseEnv({ ...base, NODE_ENV: "production" }).CORS_ORIGINS, []);
  });

  it("na Vercel, produção exige REDIS_URL", () => {
    assert.match(problemas({ ...base, NODE_ENV: "production", VERCEL: "1" }).join(), /REDIS_URL: obrigatória na Vercel/);
    assert.equal(parseEnv({ ...base, NODE_ENV: "production", VERCEL: "1", REDIS_URL: "rediss://default:x@h.upstash.io:6379" }).REDIS_URL, "rediss://default:x@h.upstash.io:6379");
    // Fora da Vercel (Docker, servidor próprio) os contadores em memória continuam valendo
    assert.equal(parseEnv({ ...base, NODE_ENV: "production" }).REDIS_URL, undefined);
  });

  it("na Vercel, sem NODE_ENV, assume produção", () => {
    const env = parseEnv({ ...base, VERCEL: "1", REDIS_URL: "rediss://default:x@h.upstash.io:6379" });
    assert.equal(env.NODE_ENV, "production");
    assert.equal(parseEnv({ ...base, VERCEL: "1", NODE_ENV: "development" }).NODE_ENV, "development");
    assert.equal(parseEnv(base).NODE_ENV, "development");
  });

  it("REDIS_URL que não é do Redis é recusada", () => {
    assert.match(problemas({ ...base, REDIS_URL: "https://h.upstash.io" }).join(), /REDIS_URL: deve ser uma URL do Redis/);
  });

  it("CORS_ORIGIN aceita lista separada por vírgula e tira a barra final", () => {
    const env = parseEnv({ ...base, NODE_ENV: "production", CORS_ORIGIN: "https://app.vercel.app/, http://localhost:5173" });
    assert.deepEqual(env.CORS_ORIGINS, ["https://app.vercel.app", "http://localhost:5173"]);
  });

  it("REGISTRATION_ENABLED=false desliga o cadastro; valor estranho é erro", () => {
    assert.equal(parseEnv({ ...base, REGISTRATION_ENABLED: "false" }).REGISTRATION_ENABLED, false);
    assert.match(problemas({ ...base, REGISTRATION_ENABLED: "nao" }).join(), /REGISTRATION_ENABLED/);
  });
});
