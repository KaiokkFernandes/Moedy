# Publicação

Como colocar o app no ar: **backend no Render** (container Docker), **frontend na Vercel** e um banco
**PostgreSQL**. Tudo cabe nos planos gratuitos.

A ordem importa, porque cada parte precisa do endereço da anterior:

1. [Banco de dados](#1-banco-de-dados) → gera a `DATABASE_URL`
2. [Backend no Render](#2-backend-no-render) → gera o endereço da API
3. [Frontend na Vercel](#3-frontend-na-vercel) → gera o endereço do site
4. [Ajustar o `CORS_ORIGIN`](#4-ajustar-o-cors_origin) no Render com o endereço final do site
5. [Criar o primeiro usuário](#5-criar-o-primeiro-usuário) e desligar o cadastro

O Render e a Vercel publicam a partir do GitHub. Antes de começar, o código precisa estar na branch `main`
do repositório.

## Antes de publicar

Teste as imagens de produção na sua máquina:

```bash
cp .env.example .env
# troque o JWT_SECRET do .env por um gerado (veja abaixo): o valor de exemplo é recusado em produção
yarn docker:prod
```

O site abre em http://localhost:8080 e a API em http://localhost:3333/api/health. Para encerrar: `yarn docker:down`.

### Como gerar um JWT_SECRET forte

```bash
openssl rand -base64 48
```

Use um valor diferente em cada ambiente e nunca o coloque em arquivo versionado. O backend exige no mínimo
32 caracteres. Trocar o segredo desloga todo mundo (os tokens antigos deixam de valer), o que também serve
como "sair de todos os dispositivos".

## 1. Banco de dados

Qualquer PostgreSQL 14+ acessível pela internet serve. Duas opções gratuitas:

| Opção | Observação |
| ----- | ---------- |
| [Neon](https://neon.tech) | Plano gratuito sem prazo de validade. **Recomendado.** |
| Render PostgreSQL | No plano gratuito o banco **expira e é apagado** cerca de 30 dias após a criação. Só para testes. |

Os limites dos planos gratuitos mudam; confira a página de preços de cada um antes de escolher.

**Neon:** crie um projeto, de preferência na região **AWS US East (N. Virginia)**, a mesma do backend no
Render. Em _Connection Details_, copie a _connection string_ **direta** (desmarque _Connection pooling_; o
host não deve ter `-pooler`), porque as migrações precisam de conexão direta. Ela tem este formato:

```
postgresql://usuario:senha@ep-xxxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Render PostgreSQL:** _New > Postgres_, na mesma região do serviço (Virginia). Use a **Internal Database URL**.

Não é preciso criar tabelas: o backend aplica as migrações sozinho toda vez que inicia.

## 2. Backend no Render

O arquivo [`render.yaml`](render.yaml) já descreve o serviço.

1. No [painel do Render](https://dashboard.render.com): **New > Blueprint** e escolha o repositório.
2. O Render lê o `render.yaml` e pede os valores marcados como segredo:

   | Variável | Valor |
   | -------- | ----- |
   | `DATABASE_URL` | A URL do passo 1 |
   | `JWT_SECRET` | O resultado de `openssl rand -base64 48` |
   | `CORS_ORIGIN` | Ainda não existe. Coloque `https://moedy.vercel.app` (ou o nome que pretende usar) e corrija no passo 4 |
   | `ANTHROPIC_API_KEY` | Opcional. Deixe vazio para manter a sugestão por IA desligada |

3. Clique em **Apply**. O primeiro build leva alguns minutos.
4. Quando terminar, abra `https://SEU-SERVICO.onrender.com/api/health`. A resposta esperada é `{"status":"ok"}`.
   Anote esse endereço (sem o `/api/health`): é o `VITE_API_URL` do próximo passo.

As demais variáveis já vêm preenchidas pelo blueprint: `NODE_ENV=production`, `REGISTRATION_ENABLED=true`,
`AI_MODEL` e `LOG_LEVEL`. A porta (`PORT`) é definida pelo próprio Render.

Se preferir criar o serviço à mão, em vez do blueprint: **New > Web Service**, linguagem **Docker**,
_Dockerfile Path_ `./backend/Dockerfile`, _Docker Build Context Directory_ `.` (a raiz, não `backend`),
_Health Check Path_ `/api/health`, e as mesmas variáveis.

Se o deploy falhar, veja os logs do serviço. O backend avisa exatamente o que falta:

```
Variáveis de ambiente inválidas:
  - JWT_SECRET: obrigatória
```

**Plano gratuito:** o serviço dorme depois de uns 15 minutos sem acessos, e a primeira requisição seguinte
leva até um minuto. O app mostra "Conectando ao servidor…" enquanto isso.

## 3. Frontend na Vercel

1. Na [Vercel](https://vercel.com/new): **Add New > Project** e importe o repositório.
2. Em **Root Directory**, escolha `frontend`. O resto (comando de instalação, build e pasta de saída) vem
   do [`frontend/vercel.json`](frontend/vercel.json); não precisa alterar.
3. Em **Environment Variables**, adicione:

   | Variável | Valor |
   | -------- | ----- |
   | `VITE_API_URL` | O endereço do backend, **sem** `/api` e sem barra no final. Ex.: `https://moedy-api.onrender.com` |

4. Clique em **Deploy** e anote o endereço final do site (ex.: `https://moedy.vercel.app`).

Dois cuidados:

- O `VITE_API_URL` é gravado no site durante o build. Se mudar a variável, faça um novo deploy
  (_Deployments > ⋯ > Redeploy_) para valer.
- A instalação usa o `yarn.lock` da raiz do repositório, então a opção _Include files outside of the Root
  Directory_ (em _Settings > Build and Deployment > Root Directory_) precisa ficar ligada, que é o padrão.
  Se a instalação reclamar da versão do Yarn, adicione a variável `ENABLE_EXPERIMENTAL_COREPACK=1` e
  refaça o deploy.

## 4. Ajustar o CORS_ORIGIN

O backend só aceita chamadas vindas dos endereços listados em `CORS_ORIGIN`. Enquanto ele não for o endereço
real do site, o login falha com "Origem não permitida".

No Render: serviço **> Environment**, edite `CORS_ORIGIN` com o endereço exato do site e salve. O serviço
reinicia sozinho.

```
https://moedy.vercel.app
```

- Sem barra no final e com `https://`.
- Para mais de um endereço (domínio próprio e o da Vercel), separe por vírgula:
  `https://financas.meudominio.com,https://moedy.vercel.app`.
- Os endereços de _preview_ da Vercel (um por branch ou pull request) não estão na lista e, por isso, não
  conseguem fazer login. É o esperado.

## 5. Criar o primeiro usuário

O seed (`yarn seed`) é só para desenvolvimento e se recusa a rodar em produção. Em produção, crie a conta
pelo próprio site:

1. Com `REGISTRATION_ENABLED=true` (o padrão do blueprint), abra o site, clique em **Criar conta** e cadastre-se.
2. No Render, mude `REGISTRATION_ENABLED` para `false` e salve.

A partir daí o cadastro responde 403 e o link some da tela de login, então ninguém mais cria conta (nem usa
a sua chave da Anthropic). Para cadastrar outra pessoa no futuro, volte a variável para `true`, faça o
cadastro e desligue de novo.

## Variáveis de ambiente

### Render (backend)

| Variável | Obrigatória | Valor |
| -------- | ----------- | ----- |
| `NODE_ENV` | sim | `production` (blueprint) |
| `DATABASE_URL` | **sim, segredo** | URL do PostgreSQL |
| `JWT_SECRET` | **sim, segredo** | 32+ caracteres, de `openssl rand -base64 48` |
| `CORS_ORIGIN` | **sim** | Endereço do site na Vercel; vários separados por vírgula |
| `REGISTRATION_ENABLED` | não | `true` até criar seu usuário, depois `false` |
| `ANTHROPIC_API_KEY` | não, segredo | Liga a sugestão de categorias por IA |
| `AI_MODEL` | não | `claude-haiku-4-5-20251001` (blueprint) |
| `LOG_LEVEL` | não | `info` (blueprint) |
| `PORT` | — | Definida pelo Render; não preencha |

### Vercel (frontend)

| Variável | Obrigatória | Valor |
| -------- | ----------- | ----- |
| `VITE_API_URL` | **sim** | Endereço do backend, sem `/api` e sem barra no final |

## Atualizações

Cada push na `main` publica sozinho: a Vercel refaz o frontend e o Render refaz o backend quando algo em
`backend/` muda. Migrações novas são aplicadas na partida do container, antes de o servidor aceitar
requisições; se uma migração falhar, o deploy falha e a versão anterior continua no ar.

O GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) roda typecheck, lint, testes, build
e a construção da imagem Docker em cada pull request e em cada push na `main`. Ele só verifica; quem publica
são o Render e a Vercel.

## Backup e restauração do banco

É preciso ter o `pg_dump` e o `pg_restore` em versão igual ou mais nova que a do servidor
(`brew install postgresql@18` no macOS). Use a URL de conexão **externa/direta** do banco.

**Backup:**

```bash
pg_dump "$DATABASE_URL" --format=custom --no-owner --no-acl --file="moedy-$(date +%F).dump"
```

**Restauração** (substitui o que estiver no banco de destino):

```bash
pg_restore --clean --if-exists --no-owner --no-acl --dbname="$DATABASE_URL" moedy-2026-10-07.dump
```

- Faça um backup antes de qualquer deploy que traga migração nova.
- O arquivo contém todos os seus dados financeiros: guarde em lugar seguro e fora do repositório.
- Para testar um backup sem tocar na produção, restaure no banco local do Docker
  (`postgresql://moedy:moedy@localhost:5433/moedy`, com o `yarn docker:dev` no ar).
- O Neon também permite voltar o banco a um ponto no tempo pelo painel (_Restore_), dentro da janela do plano.

## Como reverter um deploy

**Frontend (Vercel):** _Deployments_, abra o menu **⋯** do deploy anterior que funcionava e escolha
**Instant Rollback** (ou _Promote to Production_). A troca é imediata.

**Backend (Render):** na página do serviço, em _Events_ (ou _Deploys_), localize o deploy anterior e clique em
**Rollback**. O Render desliga o deploy automático enquanto o rollback estiver ativo; religue em
_Settings > Auto-Deploy_ depois de corrigir o problema.

**Pelo Git (vale para os dois):** desfaça o commit com problema e envie. Um novo deploy sai sozinho.

```bash
git revert <hash-do-commit>
git push origin main
```

**Atenção às migrações:** reverter o código **não** desfaz mudanças já aplicadas no banco. Se o deploy com
problema trouxe uma migração, a versão antiga do código vai rodar sobre o esquema novo. Migrações que só
adicionam tabelas ou colunas opcionais costumam conviver bem com o código antigo; as que removem ou renomeiam
algo, não. Nesse caso restaure o backup feito antes do deploy, ou escreva uma migração nova que corrija o
esquema.

## Limitações conhecidas

- **Limite de requisições em memória.** Os contadores de tentativas de login e de uso geral ficam na memória
  do processo: zeram a cada reinício e valem para uma única instância. É suficiente para um serviço só; com
  mais de uma instância seria preciso um armazenamento compartilhado (Redis).
- **Vulnerabilidades em dependências do Prisma CLI.** O `yarn npm audit` aponta falhas em pacotes que o
  `prisma` (linha de comando) traz consigo, como `mysql2` e `deepmerge-ts`. Eles não são usados pelo servidor
  em execução: o CLI só roda `migrate deploy` na partida, contra o seu próprio PostgreSQL. A correção depende
  de uma nova versão do Prisma; forçar versões por conta própria poderia quebrar o CLI. Reavalie ao atualizar
  o Prisma.
- **Token no navegador.** O token de login fica no `localStorage`. A política de segurança de conteúdo (CSP)
  do `vercel.json` reduz o risco de um script de terceiros lê-lo, mas não o elimina.
