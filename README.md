# Finanças Pessoais

App de finanças pessoais em monorepo (npm workspaces):

- **frontend/** — React + TypeScript + Vite + Tailwind CSS
- **backend/** — Node.js + Express + TypeScript + Prisma (SQLite)

## Requisitos

- Node.js **20+**
- npm 10+

## Instalação

```bash
git clone git@github.com:KaiokkFernandes/Moedy.git
cd Moedy
npm install
```

O `npm install` na raiz instala as dependências dos dois workspaces e gera o Prisma Client.

Depois, crie o arquivo de ambiente do backend e aplique as migrations:

```bash
cp backend/.env.example backend/.env
npm run prisma:migrate
```

> Em versões recentes do npm, scripts de instalação de dependências são bloqueados por padrão.
> Os pacotes que precisam deles (Prisma, better-sqlite3, esbuild) já estão liberados em
> `allowScripts` no `package.json` da raiz. Se o npm avisar sobre scripts não revisados após
> atualizar alguma dependência, rode `npm install-scripts ls` e aprove com
> `npm install-scripts approve <pacote>`.

## Rodando

```bash
npm run dev
```

Sobe frontend e backend juntos:

| Serviço  | URL                                |
| -------- | ---------------------------------- |
| Frontend | http://localhost:5173              |
| Backend  | http://localhost:3333/api/health   |

O Vite faz proxy de `/api` para o backend, então o frontend chama apenas `/api/...`.

Também é possível subir cada um separadamente:

```bash
npm run dev:backend
npm run dev:frontend
```

## Prisma

```bash
npm run prisma:migrate   # cria/aplica migrations (prisma migrate dev)
npm run prisma:studio    # abre o Prisma Studio no navegador
```

O banco SQLite fica em `backend/dev.db`.

## Variáveis de ambiente (backend/.env)

| Variável       | Exemplo                            |
| -------------- | ---------------------------------- |
| `PORT`         | `3333`                             |
| `DATABASE_URL` | `file:./dev.db`                    |
| `JWT_SECRET`   | `troque-este-segredo-em-producao`  |
