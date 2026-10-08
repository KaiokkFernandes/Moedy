import assert from "node:assert/strict";
import { describe, it } from "node:test";
import jwt from "jsonwebtoken";

process.env.DATABASE_URL ??= "postgresql://teste:teste@localhost:5432/teste";
process.env.JWT_SECRET ??= "segredo-apenas-para-os-testes-0123456789";
const { env } = await import("../config/env.js");
const { signToken, verifyToken } = await import("./jwt.js");

describe("JWT", () => {
  it("assina e verifica o próprio token, com expiração", () => {
    const token = signToken("usuario-1");
    assert.equal(verifyToken(token), "usuario-1");
    const payload = jwt.decode(token, { complete: true })!;
    assert.equal(payload.header.alg, "HS256");
    assert.ok((payload.payload as jwt.JwtPayload).exp, "tem expiração");
  });

  it("recusa token assinado com outro algoritmo, mesmo com o segredo certo", () => {
    const token = jwt.sign({}, env.JWT_SECRET, { subject: "usuario-1", algorithm: "HS512" });
    assert.throws(() => verifyToken(token), /invalid algorithm/);
  });

  it("recusa token sem assinatura (alg none), com segredo errado ou expirado", () => {
    const semAssinatura = jwt.sign({}, "", { subject: "usuario-1", algorithm: "none" });
    assert.throws(() => verifyToken(semAssinatura));
    assert.throws(() => verifyToken(jwt.sign({}, "outro-segredo-qualquer-com-32-caracteres", { subject: "u" })));
    assert.throws(() => verifyToken(jwt.sign({}, env.JWT_SECRET, { subject: "u", expiresIn: -10 })), /expired/);
  });
});
