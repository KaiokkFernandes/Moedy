import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, describe, it } from "node:test";

// O app sobe sem banco: as rotas testadas aqui respondem antes de qualquer consulta
process.env.NODE_ENV ??= "test";
process.env.DATABASE_URL ??= "postgresql://teste:teste@localhost:5432/teste";
process.env.JWT_SECRET ??= "segredo-apenas-para-os-testes-0123456789";
const { createApp } = await import("./createApp.js");
const { signToken } = await import("./lib/jwt.js");

let base = "";
let fechar = () => {};

before(async () => {
  const servidor = createApp().listen(0);
  await new Promise((resolve) => servidor.once("listening", resolve));
  base = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}/api`;
  fechar = () => servidor.close();
});
after(() => fechar());

const json = { "Content-Type": "application/json" };

describe("app HTTP (sem banco)", () => {
  it("rota inexistente: 404 em JSON", async () => {
    const resposta = await fetch(`${base}/nao-existe`, { headers: { Authorization: `Bearer ${signToken("u1")}` } });
    assert.equal(resposta.status, 404);
    assert.deepEqual(await resposta.json(), { error: "Rota não encontrada: GET /api/nao-existe" });
  });

  it("JSON malformado no corpo: 400 com mensagem clara", async () => {
    const resposta = await fetch(`${base}/auth/login`, { method: "POST", headers: json, body: "{ email: " });
    assert.equal(resposta.status, 400);
    assert.deepEqual(await resposta.json(), { error: "JSON inválido no corpo da requisição" });
  });

  it("corpo acima de 2 MB: 413", async () => {
    const resposta = await fetch(`${base}/auth/login`, { method: "POST", headers: json, body: JSON.stringify({ email: "a".repeat(2.5 * 1024 * 1024) }) });
    assert.equal(resposta.status, 413);
  });

  it("validação do login antes de tocar no banco", async () => {
    const resposta = await fetch(`${base}/auth/login`, { method: "POST", headers: json, body: JSON.stringify({ email: "não-é-email" }) });
    assert.equal(resposta.status, 400);
    const corpo = (await resposta.json()) as { issues: { campo: string }[] };
    assert.deepEqual(
      corpo.issues.map((issue) => issue.campo),
      ["email", "senha"],
    );
  });

  describe("autenticação", () => {
    const contas = (authorization?: string) => fetch(`${base}/accounts`, { headers: authorization ? { Authorization: authorization } : {} });

    it("sem token: 401", async () => {
      const resposta = await contas();
      assert.equal(resposta.status, 401);
      assert.deepEqual(await resposta.json(), { error: "Não autenticado" });
    });

    it("esquema diferente de Bearer: 401", async () => {
      assert.equal((await contas(`Basic ${signToken("u1")}`)).status, 401);
    });

    it("token adulterado ou assinado com outro segredo: 401 de sessão inválida", async () => {
      const [cabecalho, , assinatura] = signToken("u1").split(".");
      const outroCorpo = Buffer.from(JSON.stringify({ sub: "admin" })).toString("base64url");
      const resposta = await contas(`Bearer ${cabecalho}.${outroCorpo}.${assinatura}`);
      assert.equal(resposta.status, 401);
      assert.deepEqual(await resposta.json(), { error: "Sessão inválida ou expirada" });
    });
  });

  describe("CORS e origem", () => {
    it("origem do frontend de desenvolvimento é aceita, com os cabeçalhos de CORS", async () => {
      const resposta = await fetch(`${base}/auth/login`, { method: "OPTIONS", headers: { Origin: "http://localhost:5173", "Access-Control-Request-Method": "POST" } });
      assert.equal(resposta.status, 204);
      assert.equal(resposta.headers.get("access-control-allow-origin"), "http://localhost:5173");
    });

    it("outro site: 403 antes de chegar às rotas", async () => {
      const resposta = await fetch(`${base}/auth/login`, { method: "POST", headers: { ...json, Origin: "https://site-malicioso.example" }, body: "{}" });
      assert.equal(resposta.status, 403);
      assert.deepEqual(await resposta.json(), { error: "Origem não permitida" });
    });
  });

  it("cabeçalhos de segurança e id da requisição em toda resposta", async () => {
    const resposta = await fetch(`${base}/nao-existe`);
    assert.equal(resposta.headers.get("x-content-type-options"), "nosniff");
    assert.match(resposta.headers.get("content-security-policy") ?? "", /default-src 'none'/);
    assert.equal(resposta.headers.get("x-powered-by"), null);
    assert.match(resposta.headers.get("x-request-id") ?? "", /^[0-9a-f-]{36}$/);
  });

  it("onboarding: exige login e valida o corpo antes de tocar no banco", async () => {
    const semLogin = await fetch(`${base}/settings/onboarding`, { method: "PUT", headers: json, body: JSON.stringify({ tourConcluido: true }) });
    assert.equal(semLogin.status, 401);
    const vazio = await fetch(`${base}/settings/onboarding`, { method: "PUT", headers: { ...json, Authorization: `Bearer ${signToken("u1")}` }, body: "{}" });
    assert.equal(vazio.status, 400);
    assert.deepEqual(((await vazio.json()) as { issues: { mensagem: string }[] }).issues[0]?.mensagem, "Informe tourConcluido ou primeirosPassosOcultos");
  });

  it("configuração pública da autenticação", async () => {
    const resposta = await fetch(`${base}/auth/config`);
    assert.equal(resposta.status, 200);
    const corpo = (await resposta.json()) as Record<string, unknown>;
    assert.deepEqual(Object.keys(corpo).sort(), ["googleClientId", "registrationEnabled"]);
  });
});
