import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";

process.env.DATABASE_URL ??= "postgresql://teste:teste@localhost:5432/teste";
process.env.JWT_SECRET ??= "segredo-apenas-para-os-testes-0123456789";
const { criarVerificadorGoogle } = await import("./google.js");
const { AppError } = await import("../middlewares/errorHandler.js");

const CLIENT_ID = "123-abc.apps.googleusercontent.com";

// Um par de chaves no lugar das do Google: a lógica de verificação é a mesma
const { privateKey, publicKey } = await generateKeyPair("RS256");
const jwk = { ...(await exportJWK(publicKey)), kid: "chave-teste", alg: "RS256" };
const verificar = criarVerificadorGoogle(CLIENT_ID, createLocalJWKSet({ keys: [jwk] }));

type ChavePrivada = Awaited<ReturnType<typeof generateKeyPair>>["privateKey"];

const perfilPadrao = { sub: "1098765", email: "Kaio@Gmail.com", email_verified: true, name: "Kaio Fernandes" };

function token(claims: Record<string, unknown> = {}, opcoes: { aud?: string; iss?: string; exp?: string | number; chave?: ChavePrivada } = {}) {
  return new SignJWT({ ...perfilPadrao, ...claims })
    .setProtectedHeader({ alg: "RS256", kid: "chave-teste" })
    .setIssuer(opcoes.iss ?? "https://accounts.google.com")
    .setAudience(opcoes.aud ?? CLIENT_ID)
    .setIssuedAt()
    .setExpirationTime(opcoes.exp ?? "1h")
    .sign(opcoes.chave ?? privateKey);
}

async function recusa(credencial: Promise<string> | string, mensagem: RegExp) {
  await assert.rejects(verificar(await credencial), (erro) => erro instanceof AppError && erro.statusCode === 401 && mensagem.test(erro.message));
}

describe("verificação do login com Google", () => {
  it("token válido devolve o perfil, com o email em minúsculas", async () => {
    assert.deepEqual(await verificar(await token()), { googleId: "1098765", email: "kaio@gmail.com", nome: "Kaio Fernandes" });
  });

  it("aceita os dois formatos de emissor do Google", async () => {
    assert.equal((await verificar(await token({}, { iss: "accounts.google.com" }))).googleId, "1098765");
  });

  it("sem nome, usa o início do email", async () => {
    assert.equal((await verificar(await token({ name: undefined }))).nome, "kaio");
  });

  it("recusa token emitido para outro app", async () => {
    await recusa(token({}, { aud: "outro.apps.googleusercontent.com" }), /Não foi possível confirmar/);
  });

  it("recusa outro emissor", async () => {
    await recusa(token({}, { iss: "https://falso.example" }), /Não foi possível confirmar/);
  });

  it("recusa token vencido", async () => {
    await recusa(token({}, { exp: Math.floor(Date.now() / 1000) - 60 }), /Não foi possível confirmar/);
  });

  it("recusa token assinado por outra chave", async () => {
    const outra = await generateKeyPair("RS256");
    await recusa(token({}, { chave: outra.privateKey }), /Não foi possível confirmar/);
  });

  it("recusa texto que não é token", async () => {
    await recusa("nao-e-um-token", /Não foi possível confirmar/);
  });

  it("recusa email não verificado pelo Google", async () => {
    await recusa(token({ email_verified: false }), /email verificado/);
  });
});
