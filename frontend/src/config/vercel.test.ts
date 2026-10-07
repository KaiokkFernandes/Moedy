import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const raiz = new URL('../../', import.meta.url)
const html = readFileSync(new URL('index.html', raiz), 'utf8')
const vercel = JSON.parse(readFileSync(new URL('vercel.json', raiz), 'utf8')) as {
  rewrites: { source: string; destination: string }[]
  headers: { source: string; headers: { key: string; value: string }[] }[]
}

function cabecalho(source: string, key: string) {
  return vercel.headers.find((h) => h.source === source)?.headers.find((h) => h.key === key)?.value
}

test('a CSP libera exatamente o script de tema embutido no index.html', () => {
  // Se o script mudar sem atualizar o hash, o navegador o bloqueia em produção
  // e o modo escuro volta a piscar. Recalcule o hash no vercel.json.
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  assert.equal(scripts.length, 1, 'esperado um único script embutido')
  const hash = createHash('sha256').update(scripts[0][1]).digest('base64')
  const csp = cabecalho('/(.*)', 'Content-Security-Policy') ?? ''
  assert.ok(csp.includes(`'sha256-${hash}'`), `hash esperado na CSP: sha256-${hash}`)
  assert.ok(!/script-src[^;]*'unsafe-inline'/.test(csp))
})

test('rotas internas caem no index.html, mas arquivos de /assets não', () => {
  const [regra] = vercel.rewrites
  assert.equal(regra.destination, '/index.html')
  const padrao = new RegExp(`^${regra.source}$`)
  assert.ok(padrao.test('/transacoes'))
  assert.ok(padrao.test('/relatorios/2026'))
  assert.ok(!padrao.test('/assets/index-abc123.js'))
})

test('arquivos com hash no nome têm cache longo', () => {
  assert.match(cabecalho('/assets/(.*)', 'Cache-Control') ?? '', /max-age=31536000, immutable/)
})
