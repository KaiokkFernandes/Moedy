# Finanças Pessoais

App de finanças pessoais em monorepo (Yarn workspaces):

- **frontend/** — React + TypeScript + Vite + Tailwind CSS
- **backend/** — Node.js + Express + TypeScript + Prisma (SQLite)

## Requisitos

- Node.js **20+**
- Yarn (qualquer versão; o projeto fixa o **Yarn 4.18.1** em `.yarn/releases`)

Se ainda não tiver o Yarn instalado:

```bash
npm install -g yarn
```

O binário global só delega para a versão do projeto, então `yarn --version` dentro da pasta mostra `4.18.1`.

## Instalação

```bash
git clone git@github.com:KaiokkFernandes/Moedy.git
cd Moedy
yarn install
```

O `yarn install` na raiz instala as dependências dos dois workspaces e gera o Prisma Client.

Depois, crie o arquivo de ambiente do backend e aplique as migrations:

```bash
cp backend/.env.example backend/.env
yarn prisma:migrate
yarn seed
```

O `yarn seed` cria o usuário de teste definido no `backend/.env` (pode rodar mais de uma vez):

| Email             | Senha        |
| ----------------- | ------------ |
| `teste@moedy.dev` | `teste12345` |

> O Yarn 4 bloqueia scripts de build de dependências por padrão. Os pacotes que precisam deles
> (Prisma, better-sqlite3, esbuild) estão liberados em `dependenciesMeta` no `package.json` da raiz.
> Se surgir outra dependência nativa, adicione-a lá com `"built": true`.
>
> O Yarn também recusa versões publicadas há menos de 1 dia (`npmMinimalAgeGate`). Se um
> `yarn add` falhar com "quarantined", use uma versão um pouco anterior.

## Rodando

```bash
yarn dev
```

Sobe frontend e backend juntos:

| Serviço  | URL                                |
| -------- | ---------------------------------- |
| Frontend | http://localhost:5173              |
| Backend  | http://localhost:3333/api/health   |

O Vite faz proxy de `/api` para o backend, então o frontend chama apenas `/api/...`.

Também é possível subir cada um separadamente:

```bash
yarn dev:backend
yarn dev:frontend
```

## Prisma

```bash
yarn prisma:migrate   # cria/aplica migrations (prisma migrate dev)
yarn prisma:studio    # abre o Prisma Studio no navegador
yarn seed             # cria/atualiza o usuário de teste e as categorias padrão
```

Valores monetários são sempre guardados em **centavos** (inteiros), nunca em ponto flutuante.

O banco SQLite fica em `backend/dev.db`.

## Variáveis de ambiente (backend/.env)

| Variável       | Exemplo                            |
| -------------- | ---------------------------------- |
| `PORT`         | `3333`                             |
| `DATABASE_URL` | `file:./dev.db`                    |
| `JWT_SECRET`   | `troque-este-segredo-em-producao`  |
| `SEED_USER_NOME` / `SEED_USER_EMAIL` / `SEED_USER_SENHA` | usuário de teste do seed |

## Autenticação

| Rota                      | Descrição                                              |
| ------------------------- | ------------------------------------------------------ |
| `POST /api/auth/register` | `{ nome, email, senha }` (senha com 8+ caracteres) → `{ token, user }` |
| `POST /api/auth/login`    | `{ email, senha }` → `{ token, user }`                 |
| `GET /api/auth/me`        | usuário logado (header `Authorization: Bearer <token>`) |

Erros seguem o formato `{ "error": "mensagem" }`: **400** validação (com `issues: [{ campo, mensagem }]`),
**401** não autenticado, **409** email já cadastrado. Todo usuário novo recebe as categorias padrão.

No frontend, o token fica no `localStorage`; rotas da área logada redirecionam para `/login` sem sessão.
