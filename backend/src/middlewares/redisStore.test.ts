import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Options } from "express-rate-limit";
import type { Redis } from "ioredis";
import { RedisStore } from "./redisStore.js";

/** Redis em memória que entende só o que o armazenamento usa (o script de incremento, DECR e DEL). */
function redisFalso() {
  const dados = new Map<string, { valor: number; expiraEm: number }>();
  let agora = 0;
  const vivo = (chave: string) => {
    const item = dados.get(chave);
    if (item && item.expiraEm <= agora) dados.delete(chave);
    return dados.get(chave);
  };
  const redis = {
    async eval(_script: string, _numChaves: number, chave: string, janelaMs: number) {
      const item = vivo(chave);
      if (!item) {
        dados.set(chave, { valor: 1, expiraEm: agora + Number(janelaMs) });
        return [1, Number(janelaMs)];
      }
      item.valor++;
      return [item.valor, item.expiraEm - agora];
    },
    async decr(chave: string) {
      const item = vivo(chave);
      if (item) item.valor--;
    },
    async del(chave: string) {
      dados.delete(chave);
    },
  };
  return { redis: redis as unknown as Redis, dados, avancar: (ms: number) => (agora += ms) };
}

const opcoes = (windowMs: number) => ({ windowMs }) as Options;

describe("contadores de limite no Redis", () => {
  it("conta as batidas dentro da janela e informa quando ela zera", async () => {
    const { redis, avancar } = redisFalso();
    const store = new RedisStore(redis, "limite:login:");
    store.init(opcoes(60_000));

    assert.equal((await store.increment("1.2.3.4")).totalHits, 1);
    avancar(10_000);
    const segunda = await store.increment("1.2.3.4");
    assert.equal(segunda.totalHits, 2);
    const faltam = (segunda.resetTime?.getTime() ?? 0) - Date.now();
    assert.ok(faltam > 49_000 && faltam <= 50_000, `faltam ${faltam} ms`);
  });

  it("uma nova janela começa do zero depois que a anterior expira", async () => {
    const { redis, avancar } = redisFalso();
    const store = new RedisStore(redis, "p:");
    store.init(opcoes(1_000));
    await store.increment("ip");
    await store.increment("ip");
    avancar(1_000);
    assert.equal((await store.increment("ip")).totalHits, 1);
  });

  it("o prefixo separa os limites (login e cadastro não se misturam)", async () => {
    const { redis, dados } = redisFalso();
    const login = new RedisStore(redis, "limite:login:");
    const cadastro = new RedisStore(redis, "limite:cadastro:");
    login.init(opcoes(60_000));
    cadastro.init(opcoes(60_000));
    await login.increment("ip");
    await login.increment("ip");
    assert.equal((await cadastro.increment("ip")).totalHits, 1);
    assert.deepEqual([...dados.keys()].sort(), ["limite:cadastro:ip", "limite:login:ip"]);
  });

  it("decrement desfaz uma batida (logins certos não contam) e resetKey zera", async () => {
    const { redis } = redisFalso();
    const store = new RedisStore(redis, "p:");
    store.init(opcoes(60_000));
    await store.increment("ip");
    await store.increment("ip");
    await store.decrement("ip");
    assert.equal((await store.increment("ip")).totalHits, 2);
    await store.resetKey("ip");
    assert.equal((await store.increment("ip")).totalHits, 1);
  });

  it("contadores valem entre instâncias (localKeys = false)", () => {
    assert.equal(new RedisStore(redisFalso().redis, "p:").localKeys, false);
  });
});
