import type { IncrementResponse, Options, Store } from "express-rate-limit";
import type { Redis } from "ioredis";

/**
 * Incrementa o contador e, na primeira batida da janela, define a expiração. Tudo num único
 * comando, para duas instâncias não abrirem a mesma janela ao mesmo tempo.
 */
const INCREMENTAR = `
local restante = redis.call("PTTL", KEYS[1])
if restante <= 0 then
  redis.call("SET", KEYS[1], 1, "PX", ARGV[1])
  return {1, tonumber(ARGV[1])}
end
return {redis.call("INCR", KEYS[1]), restante}
`;

/**
 * Contadores do express-rate-limit guardados no Redis, compartilhados entre instâncias.
 * Nada é carregado na inicialização: um Redis fora do ar ao subir não deixa o limite quebrado.
 */
export class RedisStore implements Store {
  readonly localKeys = false;
  private windowMs = 60_000;

  constructor(
    private readonly redis: Redis,
    readonly prefix: string,
  ) {}

  init(options: Options) {
    this.windowMs = options.windowMs;
  }

  async increment(chave: string): Promise<IncrementResponse> {
    const [totalHits, restanteMs] = (await this.redis.eval(INCREMENTAR, 1, this.prefix + chave, this.windowMs)) as [number, number];
    return { totalHits, resetTime: new Date(Date.now() + restanteMs) };
  }

  async decrement(chave: string) {
    await this.redis.decr(this.prefix + chave);
  }

  async resetKey(chave: string) {
    await this.redis.del(this.prefix + chave);
  }
}
