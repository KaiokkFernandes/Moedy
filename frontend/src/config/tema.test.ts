import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'

const src = new URL('../', import.meta.url).pathname
const css = readFileSync(join(src, 'index.css'), 'utf8')

/** Cores semânticas do tema: --color-X dentro do @theme. */
const cores = new Set([...css.matchAll(/--color-([a-z0-9-]+):/g)].map((m) => m[1]))

function arquivos(pasta: string): string[] {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome)
    if (statSync(caminho).isDirectory()) return arquivos(caminho)
    return /\.tsx?$/.test(nome) && !nome.endsWith('.test.ts') ? [caminho] : []
  })
}

// Utilitários bg-* que não são cor
const NAO_SAO_COR = new Set(['transparent', 'current', 'inherit', 'none', 'clip', 'cover', 'contain', 'center', 'fixed', 'no-repeat'])

test('toda classe bg-* usada nos componentes é uma cor definida no tema', () => {
  // Com uma cor inexistente, o Tailwind não gera a classe e o fundo some sem aviso
  const faltando = new Map<string, string>()
  for (const arquivo of arquivos(src)) {
    for (const [, nome] of readFileSync(arquivo, 'utf8').matchAll(/(?:^|[\s"'`:])bg-([a-z][a-z0-9-]*)(?:\/\d+)?(?=[\s"'`]|$)/gm)) {
      if (!cores.has(nome) && !NAO_SAO_COR.has(nome) && !/^(gradient|linear|radial)/.test(nome)) {
        faltando.set(`bg-${nome}`, arquivo.slice(src.length))
      }
    }
  }
  assert.deepEqual(Object.fromEntries(faltando), {})
})
