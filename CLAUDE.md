# Moedy

App de finanças pessoais: monorepo com Yarn 4 (`frontend/` React + Vite, `backend/` Express + Prisma).
Textos, commits e comentários em português.

## Regras do fluxo de trabalho

- Nunca commitar direto na `main`. Antes de qualquer mudança:
  `git checkout main && git pull && git checkout -b <tipo>/<nome>` (feat, fix, chore, docs, test, ci).
- Toda feature ou correção vem com testes unitários (`node:test` + `tsx`, arquivo `.test.ts` ao lado do
  código). Bug corrigido ganha o teste que o reproduz.
- Antes de concluir: `yarn lint && yarn typecheck && yarn test:coverage && yarn build`.
- Commits pequenos, um por etapa, em Conventional Commits em português. Não fazer push nem merge: o dono
  do repositório abre e mergeia o pull request.

Detalhes do fluxo, do CI e dos testes: [CONTRIBUTING.md](CONTRIBUTING.md). Publicação: [DEPLOY.md](DEPLOY.md).
