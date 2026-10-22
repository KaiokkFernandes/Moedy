import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const frontend = new URL('../../', import.meta.url)
const html = readFileSync(new URL('index.html', frontend), 'utf8')
// O vercel.json fica na raiz do repositório; as regras do site estão no serviço "frontend"
const config = JSON.parse(readFileSync(new URL('../vercel.json', frontend), 'utf8')) as {
  services: Record<string, ServicoVercel>
  rewrites: { source: string; destination: { service: string } }[]
}
type ServicoVercel = {
  rewrites: { source: string; destination: string }[]
  headers: { source: string; headers: { key: string; value: string }[] }[]
}
const vercel = config.services.frontend

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

test('a CSP libera o login com Google só nos endereços do Google Identity', () => {
  const csp = cabecalho('/(.*)', 'Content-Security-Policy') ?? ''
  const diretiva = (nome: string) => csp.split(';').map((parte) => parte.trim()).find((parte) => parte.startsWith(`${nome} `)) ?? ''
  assert.match(diretiva('script-src'), / https:\/\/accounts\.google\.com\/gsi\/client( |$)/)
  assert.match(diretiva('frame-src'), / https:\/\/accounts\.google\.com\/gsi\/( |$)/)
  assert.match(diretiva('connect-src'), / https:\/\/accounts\.google\.com\/gsi\/( |$)/)
  // Nada de liberar o domínio inteiro do Google para scripts
  assert.doesNotMatch(diretiva('script-src'), /https:\/\/accounts\.google\.com(\/)?( |$)/)
})

test('rotas internas caem no index.html, mas arquivos de /assets não', () => {
  const [regra] = vercel.rewrites
  assert.equal(regra.destination, '/index.html')
  const padrao = new RegExp(`^${regra.source}$`)
  assert.ok(padrao.test('/transacoes'))
  assert.ok(padrao.test('/relatorios/2026'))
  assert.ok(!padrao.test('/assets/index-abc123.js'))
})

test('/api vai para o backend e o resto para o frontend, nessa ordem', () => {
  assert.deepEqual(
    config.rewrites.map((regra) => [regra.source, regra.destination.service]),
    [
      ['/api/(.*)', 'backend'],
      ['/(.*)', 'frontend'],
    ],
  )
})

test('arquivos com hash no nome têm cache longo', () => {
  assert.match(cabecalho('/assets/(.*)', 'Cache-Control') ?? '', /max-age=31536000, immutable/)
})
