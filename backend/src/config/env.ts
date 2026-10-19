import "dotenv/config";
import { z } from "zod";

/** Valores de exemplo do .env.example (o atual e o antigo): nunca podem chegar à produção. */
const JWT_SECRETS_DE_EXEMPLO = [
  "troque-por-um-segredo-com-pelo-menos-32-caracteres",
  "troque-este-segredo-em-producao",
];

const booleano = z
  .enum(["true", "false"], { error: "use true ou false" })
  .transform((valor) => valor === "true");

const inteiroPositivo = z.coerce.number({ error: "deve ser um número" }).int("deve ser um número inteiro").positive("deve ser maior que zero");

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"], { error: "use development, test ou production" }).default("development"),
    PORT: z.coerce.number({ error: "deve ser um número" }).int().min(1).max(65535).default(3333),
    DATABASE_URL: z
      .string({ error: "obrigatória (ex.: postgresql://usuario:senha@host:5432/banco)" })
      .regex(/^postgres(ql)?:\/\/.+/, "deve ser uma URL do PostgreSQL (postgresql://...)"),
    JWT_SECRET: z.string({ error: "obrigatória" }).min(32, "deve ter pelo menos 32 caracteres"),
    /**
     * Outras origens autorizadas a chamar a API, separadas por vírgula. O próprio domínio do app
     * (frontend e API no mesmo endereço, como na Vercel) é sempre aceito.
     */
    CORS_ORIGIN: z.string().optional(),
    /** Redis dos contadores de limite de requisições. Sem ele, os contadores ficam em memória. */
    REDIS_URL: z.string().regex(/^rediss?:\/\/.+/, "deve ser uma URL do Redis (redis:// ou rediss://)").optional(),
    /** Definida pela própria Vercel ("1") no build e na execução. */
    VERCEL: z.string().optional(),
    /** Com `false`, o cadastro de novos usuários responde 403. */
    REGISTRATION_ENABLED: booleano.default(true),
    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).optional(),
    // Sugestão de categorias por IA (opcional)
    ANTHROPIC_API_KEY: z.string().optional(),
    AI_MODEL: z.string().optional(),
    AI_TIMEOUT_MS: inteiroPositivo.optional(),
    AI_MAX_TRANSACTIONS: inteiroPositivo.optional(),
  })
  .superRefine((valores, ctx) => {
    if (valores.NODE_ENV !== "production") return;
    // Na Vercel cada requisição pode cair numa instância diferente: contadores em memória não
    // seguram tentativas de login em sequência
    if (valores.VERCEL && !valores.REDIS_URL) {
      ctx.addIssue({ code: "custom", path: ["REDIS_URL"], message: "obrigatória na Vercel (ex.: rediss://default:senha@host.upstash.io:6379)" });
    }
    if (JWT_SECRETS_DE_EXEMPLO.includes(valores.JWT_SECRET)) {
      ctx.addIssue({ code: "custom", path: ["JWT_SECRET"], message: "é o valor de exemplo; gere um segredo próprio" });
    }
  })
  .transform(({ CORS_ORIGIN, ...valores }) => ({
    ...valores,
    /** Fora de produção, sem CORS_ORIGIN, vale o endereço do Vite. */
    CORS_ORIGINS: (CORS_ORIGIN?.trim() || (valores.NODE_ENV === "production" ? "" : "http://localhost:5173"))
      .split(",")
      .map((origem) => origem.trim().replace(/\/$/, ""))
      .filter(Boolean),
  }));

export type Env = z.infer<typeof schema>;

export class EnvError extends Error {
  constructor(readonly problemas: string[]) {
    super(`Variáveis de ambiente inválidas:\n${problemas.map((problema) => `  - ${problema}`).join("\n")}`);
    this.name = "EnvError";
  }
}

/** Valida as variáveis de ambiente. As mensagens trazem só o nome da variável, nunca o valor. */
export function parseEnv(source: Record<string, string | undefined>): Env {
  // Variável definida mas vazia (comum em painéis de hospedagem) conta como ausente
  const limpo = Object.fromEntries(Object.entries(source).filter(([, valor]) => valor !== undefined && valor !== ""));
  const resultado = schema.safeParse(limpo);
  if (!resultado.success) {
    throw new EnvError(resultado.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`));
  }
  return resultado.data;
}

function carregar(): Env {
  try {
    return parseEnv(process.env);
  } catch (erro) {
    if (erro instanceof EnvError) {
      // Antes do logger existir: o servidor não sobe com configuração inválida
      console.error(`\n${erro.message}\n\nConfira o arquivo .env (ou as variáveis do serviço) e tente de novo.\n`);
      process.exit(1);
    }
    throw erro;
  }
}

/** Configuração validada. Importar este módulo encerra o processo se algo obrigatório faltar. */
export const env = carregar();
