# Publicação

O app inteiro fica num **único projeto da Vercel**: o frontend em `/` e o backend em `/api`, no mesmo
endereço e publicados juntos a cada push. Além da Vercel, são dois serviços externos, todos com plano
gratuito:

| Serviço | Para quê |
| ------- | -------- |
| [Vercel](https://vercel.com) (plano Hobby) | Frontend e backend. O [`vercel.json`](vercel.json) da raiz descreve os dois (recurso _Services_) |
| [Neon](https://neon.tech) | Banco PostgreSQL |
| [Upstash](https://upstash.com) | Redis que guarda os contadores de tentativas de login, cadastro e IA |

Por que o Redis: na Vercel o backend roda em funções, e cada requisição pode cair numa instância
diferente. Contadores em memória deixariam o limite de tentativas de login praticamente sem efeito.

Ordem dos passos:

1. [Banco no Neon](#1-banco-no-neon) → `DATABASE_URL` e `DATABASE_URL_UNPOOLED`
2. [Redis no Upstash](#2-redis-no-upstash) → `REDIS_URL`
3. [Projeto na Vercel](#3-projeto-na-vercel) com as variáveis
4. [Criar o primeiro usuário](#4-criar-o-primeiro-usuário) e desligar o cadastro

A Vercel publica a partir do GitHub: antes de começar, o código precisa estar na branch `main`.

## Antes de publicar

Teste as imagens de produção na sua máquina:

```bash
cp .env.example .env
# troque o JWT_SECRET do .env por um gerado (veja abaixo): o valor de exemplo é recusado em produção
yarn docker:prod
```

O site abre em http://localhost:8080. Para encerrar: `yarn docker:down`. Esse teste usa Docker e não a
Vercel, mas é o mesmo código, com as mesmas regras de produção.

### Como gerar um JWT_SECRET forte

```bash
openssl rand -base64 48
```

Use um valor diferente em cada ambiente e nunca o coloque em arquivo versionado. O backend exige no mínimo
32 caracteres. Trocar o segredo desloga todo mundo (os tokens antigos deixam de valer), o que também serve
como "sair de todos os dispositivos".

## 1. Banco no Neon

Escolha **um** dos dois caminhos.

**Pela Vercel (mais simples).** Depois de criar o projeto no passo 3, abra a aba **Storage** do projeto,
clique em **Create Database**, escolha **Neon** e a região **US East (N. Virginia)**, a mesma das funções
da Vercel. A integração cria o banco e já adiciona `DATABASE_URL` e `DATABASE_URL_UNPOOLED` às variáveis do
projeto. Neste caso, faça o passo 3 primeiro e volte aqui.

**Direto no Neon.** Crie um projeto em [console.neon.tech](https://console.neon.tech), na região
**AWS US East (N. Virginia)**. Em _Connect_, copie duas URLs:

| Variável | Qual URL |
| -------- | -------- |
| `DATABASE_URL` | Com _Connection pooling_ ligado (o host tem `-pooler`). É a que o app usa |
| `DATABASE_URL_UNPOOLED` | Com _Connection pooling_ desligado (conexão direta). É a que as migrações usam |

Não é preciso criar tabelas: as migrações são aplicadas sozinhas a cada deploy de produção.

## 2. Redis no Upstash

1. Em [console.upstash.com](https://console.upstash.com), crie um banco **Redis** na região
   **N. Virginia (us-east-1)**.
2. Na página do banco, em _Connect_, copie a URL no formato `rediss://default:SENHA@HOST.upstash.io:6379`.
   Essa é a `REDIS_URL`.

Use a URL `rediss://` (conexão Redis normal), não a URL `https://` da API REST. Pelo mesmo motivo, crie o
Redis direto no Upstash: a integração do Upstash pela aba Storage da Vercel cadastra só as variáveis da API
REST, que o backend não usa.

O plano gratuito tem uma cota mensal de comandos. O app só fala com o Redis em login, cadastro e nas rotas
de IA, então o uso pessoal fica muito abaixo dela.

## 3. Projeto na Vercel

1. Em [vercel.com/new](https://vercel.com/new), importe o repositório.
2. Deixe **Root Directory** como `./` (a raiz) e **Application Preset** como **Services**. A Vercel mostra o
   `frontend` (Vite, em `/`) e o `backend` (Express, em `/api`). **Não** use _Import single project_: o
   `vercel.json` da raiz já junta os dois.
3. Em **Environment Variables**, adicione:

   | Variável | Valor |
   | -------- | ----- |
   | `DATABASE_URL` | URL com pooler do passo 1 (pule se for usar a integração do Neon) |
   | `DATABASE_URL_UNPOOLED` | URL direta do passo 1 (idem) |
   | `REDIS_URL` | URL `rediss://` do passo 2 |
   | `JWT_SECRET` | O resultado de `openssl rand -base64 48` |
   | `REGISTRATION_ENABLED` | `true` (até criar o seu usuário) |
   | `ANTHROPIC_API_KEY` | Opcional: liga a sugestão de categorias por IA |

4. Clique em **Deploy**. O build instala e compila os dois serviços e, por ser o deploy de produção,
   aplica as migrações no banco.
5. Abra `https://SEU-PROJETO.vercel.app/api/health`. A resposta esperada é `{"status":"ok"}`.

Não é preciso definir `NODE_ENV`, `PORT`, `CORS_ORIGIN` nem `VITE_API_URL`. Na Vercel o backend assume
produção sozinho, a plataforma cuida da porta, e o frontend chama a API no mesmo endereço.

Se uma variável obrigatória faltar, a função do backend não sobe e o motivo aparece em
**Logs** (ou na aba _Functions_ do deploy):

```
Variáveis de ambiente inválidas:
  - REDIS_URL: obrigatória na Vercel (ex.: rediss://default:senha@host.upstash.io:6379)
```

Depois de adicionar ou mudar uma variável, faça um novo deploy (_Deployments > ⋯ > Redeploy_) para valer.

**Primeiro acesso:** depois de um tempo sem uso, a primeira requisição leva alguns segundos enquanto a
função inicia. O app mostra "Conectando ao servidor…" se passar de 4 segundos.

## 4. Criar o primeiro usuário

O seed (`yarn seed`) é só para desenvolvimento e se recusa a rodar em produção. Em produção, crie a conta
pelo próprio site:

1. Com `REGISTRATION_ENABLED=true`, abra o site, clique em **Criar conta** e cadastre-se.
2. Na Vercel, mude `REGISTRATION_ENABLED` para `false` e faça **Redeploy**.

A partir daí o cadastro responde 403 e o link some da tela de login, então ninguém mais cria conta (nem usa
a sua chave da Anthropic). Para cadastrar outra pessoa no futuro, volte a variável para `true`, faça o
cadastro e desligue de novo.

## Variáveis de ambiente na Vercel

| Variável | Obrigatória | Valor |
| -------- | ----------- | ----- |
| `DATABASE_URL` | **sim, segredo** | URL do Neon com pooler |
| `DATABASE_URL_UNPOOLED` | recomendada, segredo | URL direta do Neon, para as migrações. Sem ela, as migrações usam a `DATABASE_URL` |
| `REDIS_URL` | **sim, segredo** | URL `rediss://` do Upstash |
| `JWT_SECRET` | **sim, segredo** | 32+ caracteres, de `openssl rand -base64 48` |
| `REGISTRATION_ENABLED` | não | `true` até criar seu usuário, depois `false` |
| `ANTHROPIC_API_KEY` | não, segredo | Liga a sugestão de categorias por IA |
| `AI_MODEL` | não | Padrão `claude-haiku-4-5-20251001` |
| `LOG_LEVEL` | não | Padrão `info` |
| `CORS_ORIGIN` | não | Só se outro site (outro domínio) precisar chamar a API |

## Deploys de preview

A Vercel cria um deploy de preview para cada branch e pull request, com endereço próprio. Neles o build
**não** aplica migrações, para um preview nunca alterar o banco de produção.

Se as variáveis do banco também estiverem marcadas para o ambiente _Preview_, o preview usa o mesmo banco
da produção, com os seus dados reais. Funciona enquanto a branch não trouxer migração nova; se trouxer, o
preview vai falhar ao acessar as tabelas novas. Para previews isolados, marque as variáveis do banco só
para _Production_ (os previews ficam sem API) ou use um banco separado para _Preview_; a integração do
Neon oferece criar um banco por preview.

## Atualizações

Cada push na `main` publica sozinho. Migrações novas são aplicadas durante o build, antes de o código novo
entrar no ar; se uma migração falhar, o deploy falha e a versão anterior continua servindo.

O GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) roda typecheck, lint, testes,
build e a construção da imagem Docker em cada pull request e em cada push na `main`. Ele só verifica; quem
publica é a Vercel.

## Backup e restauração do banco

É preciso ter o `pg_dump` e o `pg_restore` em versão igual ou mais nova que a do servidor
(`brew install postgresql@18` no macOS). Use a URL **direta** (`DATABASE_URL_UNPOOLED`).

**Backup:**

```bash
pg_dump "$DATABASE_URL_UNPOOLED" --format=custom --no-owner --no-acl --file="moedy-$(date +%F).dump"
```

**Restauração** (substitui o que estiver no banco de destino):

```bash
pg_restore --clean --if-exists --no-owner --no-acl --dbname="$DATABASE_URL_UNPOOLED" moedy-2026-10-19.dump
```

- Faça um backup antes de qualquer deploy que traga migração nova.
- O arquivo contém todos os seus dados financeiros: guarde em lugar seguro e fora do repositório.
- Para testar um backup sem tocar na produção, restaure no banco local do Docker
  (`postgresql://moedy:moedy@localhost:5433/moedy`, com o `yarn docker:dev` no ar).
- O Neon também permite voltar o banco a um ponto no tempo pelo painel (_Restore_), dentro da janela do
  plano, que é curta no gratuito.

## Como reverter um deploy

**Pela Vercel:** em _Deployments_, abra o menu **⋯** do deploy anterior que funcionava e escolha
**Instant Rollback** (ou _Promote to Production_). A troca é imediata e vale para frontend e backend
juntos. No plano Hobby, o rollback volta para o deploy de produção anterior.

**Pelo Git:** desfaça o commit com problema e envie. Um novo deploy sai sozinho.

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

- **Tamanho das requisições.** A Vercel aceita no máximo 4,5 MB por requisição e por resposta. O upload de
  extrato é limitado a 4 MB. A exportação de CSV de um período muito longo (dezenas de milhares de
  transações) pode passar do limite: nesse caso, exporte em períodos menores.
- **Tempo por requisição.** No plano Hobby, cada requisição pode durar até 5 minutos. A sugestão por IA
  desiste antes, com 20 segundos.
- **Services está em beta.** O recurso da Vercel que junta frontend e backend num projeto ainda está em
  beta. Se algo mudar, a alternativa é importar o `frontend` e o `backend` como dois projetos separados.
  Nesse caso, defina `VITE_API_URL` no frontend com o endereço do backend, coloque o endereço do frontend em
  `CORS_ORIGIN` no backend e libere esse endereço no `connect-src` da CSP no `vercel.json`.
- **Plano Hobby é para uso pessoal.** Uso comercial exige o plano Pro.
- **Limite geral de requisições por instância.** O limite geral (600 por minuto por IP) fica na memória de
  cada instância, de propósito. Os limites que precisam ser exatos (login, cadastro e IA) ficam no Redis.
- **Se o Redis cair**, as requisições passam sem limite (com aviso no log) em vez de a API parar.
- **Vulnerabilidades em dependências do Prisma CLI.** O `yarn npm audit` aponta falhas em pacotes que o
  `prisma` (linha de comando) traz consigo, como `mysql2` e `deepmerge-ts`. Eles não fazem parte do servidor
  em execução: o CLI só roda `migrate deploy` durante o build, contra o seu próprio PostgreSQL. A correção
  depende de uma nova versão do Prisma; forçar versões por conta própria poderia quebrar o CLI. Reavalie ao
  atualizar o Prisma.
- **Token no navegador.** O token de login fica no `localStorage`. A política de segurança de conteúdo (CSP)
  do `vercel.json` reduz o risco de um script de terceiros lê-lo, mas não o elimina.
