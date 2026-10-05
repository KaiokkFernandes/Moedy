# Finanças Pessoais

App de finanças pessoais em monorepo (Yarn workspaces):

- **frontend/** — React + TypeScript + Vite + Tailwind CSS
- **backend/** — Node.js + Express + TypeScript + Prisma (PostgreSQL)

## Requisitos

- Node.js **20+**
- PostgreSQL 14+ (veja abaixo)
- Yarn (qualquer versão; o projeto fixa o **Yarn 4.18.1** em `.yarn/releases`)

Se ainda não tiver o Yarn instalado:

```bash
npm install -g yarn
```

O binário global só delega para a versão do projeto, então `yarn --version` dentro da pasta mostra `4.18.1`.

## Banco de dados (PostgreSQL)

O projeto usa PostgreSQL. No macOS, com Homebrew:

```bash
brew install postgresql@18
brew services start postgresql@18
```

Crie o usuário e o banco de desenvolvimento (os mesmos do `backend/.env.example`):

```bash
/opt/homebrew/opt/postgresql@18/bin/psql -d postgres \
  -c "CREATE ROLE moedy LOGIN PASSWORD 'moedy' CREATEDB;" \
  -c "CREATE DATABASE moedy OWNER moedy;"
```

O `CREATEDB` é necessário porque o `prisma migrate dev` cria um banco temporário para comparar as migrations.
Para parar o serviço: `brew services stop postgresql@18`.

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

O `yarn seed` cria o usuário de teste definido no `backend/.env`, com duas contas (corrente e cartão), cerca de
3 meses de transações fictícias (incluindo o pagamento mensal da fatura do cartão, marcado para ficar fora dos
relatórios), as regras de categorização padrão e orçamentos no mês atual (um estourado, um em atenção e os
demais dentro do limite), com os alertas correspondentes. Pode rodar mais de uma vez sem duplicar nada:

| Email             | Senha        |
| ----------------- | ------------ |
| `teste@moedy.dev` | `teste12345` |

> O Yarn 4 bloqueia scripts de build de dependências por padrão. Os pacotes que precisam deles
> (Prisma, esbuild) estão liberados em `dependenciesMeta` no `package.json` da raiz.
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

Para abrir o banco em um cliente como o Beekeeper Studio, crie uma conexão **Postgres** com host `localhost`,
porta `5432`, usuário `moedy`, senha `moedy` e banco `moedy`.

## Variáveis de ambiente (backend/.env)

| Variável       | Exemplo                            |
| -------------- | ---------------------------------- |
| `PORT`         | `3333`                             |
| `DATABASE_URL` | `postgresql://moedy:moedy@localhost:5432/moedy?schema=public` |
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

## API

Todas as rotas abaixo exigem `Authorization: Bearer <token>` e só enxergam os dados do usuário logado
(recursos de outro usuário respondem **404**). Valores são sempre em **centavos**; datas, em `AAAA-MM-DD`.

| Recurso | Rotas |
| ------- | ----- |
| Contas | `GET /api/accounts` (com `saldoAtual` e `totalTransacoes`), `POST`, `PUT /:id`, `DELETE /:id` |
| Categorias | `GET /api/categories?tipo=`, `POST`, `PUT /:id`, `DELETE /:id` |
| Transações | `GET /api/transactions`, `POST`, `PUT /:id`, `PATCH /:id/category`, `DELETE /:id` |
| Regras | `GET /api/category-rules`, `POST`, `PUT /:id`, `DELETE /:id`, `POST /api/category-rules/apply` |
| Importação | `POST /api/import/preview`, `POST /api/import/confirm` |
| Orçamentos | `GET /api/budgets?mes=&ano=`, `POST`, `PUT /:id`, `DELETE /:id`, `POST /copy`, `GET /suggestions`, `POST /from-suggestions` |
| Alertas | `GET /api/notifications`, `GET /unread-count`, `PATCH /:id/read`, `POST /read-all`, `DELETE /:id` |
| Relatórios | `GET /api/reports/summary`, `by-category`, `monthly`, `daily`, `top-merchants`, `largest-expenses`, `recurring`, `category-trend`, `export` |

- **Excluir conta com transações** responde 409 até receber `?confirm=true`, porque apaga as transações junto.
- **Excluir categoria** não apaga transações: elas ficam sem categoria.
- **Filtros de transações:** `dataInicio`, `dataFim`, `accountId`, `categoryId`, `tipo`, `busca`, `semCategoria`,
  `page` e `pageSize` (máx. 100). A resposta traz `itens`, `total`, `totalReceitas` e `totalDespesas` do filtro.

## Painel e relatórios

Todas as rotas de `/api/reports` aceitam `dataInicio`, `dataFim` e `accountId` (opcionais; sem datas, vale o
mês atual). As somas e os agrupamentos são feitos pelo banco.

| Rota | O que devolve |
| ---- | ------------- |
| `summary` | Receitas, despesas e saldo do período, os mesmos números do período anterior e a variação % (`null` quando o anterior é zero), além do saldo das contas no início e no fim |
| `by-category?tipo=` | Total, percentual e quantidade por categoria (com cor e ícone), incluindo "Sem categoria" |
| `monthly?meses=12` | Receitas, despesas e saldo por mês; meses sem movimento vêm com zero |
| `daily` | Gasto acumulado dia a dia no mês de referência e no anterior |
| `top-merchants?limite=10` | Maiores estabelecimentos, juntando descrições parecidas (sem parcela e códigos no fim) |
| `largest-expenses?limite=5` | As maiores despesas do período |
| `recurring` | Cobranças fixas: mesma descrição, valor parecido (±20%), 3+ meses seguidos e ainda ativas |
| `category-trend?categoryId=` | Evolução mensal de uma categoria (ou `semCategoria=true&tipo=`) |
| `export` | CSV das transações do período (`;`, vírgula decimal, UTF-8 com BOM para o Excel) |

- **Período anterior:** meses cheios são comparados com os meses cheios anteriores; qualquer outro intervalo,
  com o mesmo número de dias imediatamente antes.
- **Fuso:** "hoje" e o "mês atual" seguem America/Sao_Paulo. As transações guardam só o dia (sem hora), então
  uma compra do dia 31 é sempre do dia 31.
- **Transferências e pagamento de fatura:** transações marcadas com `ignorarNosRelatorios` ficam fora de todos
  os relatórios e dos totais da listagem de transações, mas continuam contando no saldo das contas. A marcação
  é feita na edição da transação ou na revisão da importação (que já sugere para descrições como "pagamento de
  fatura"). O CSV exportado traz todas, com a coluna "Fora dos relatórios".

## Orçamentos e alertas

Um orçamento é o limite de gasto de uma categoria de despesa em um mês (um por categoria por mês). O gasto usa
a mesma regra dos relatórios: só despesas, sem as transações marcadas para ignorar.

- `GET /api/budgets?mes=&ano=` devolve cada orçamento com gasto, restante, percentual e status (`OK`, `ATENCAO`
  a partir de 80%, `ESTOURADO` a partir de 100%), o resumo do mês e as categorias com gasto e sem orçamento.
- **Projeção** (só no mês atual): as cobranças fixas detectadas contam uma vez, e o resto do gasto é projetado
  no ritmo atual (gasto por dia até hoje × dias do mês).
- `POST /api/budgets/copy` copia de um mês para outro sem sobrescrever os que já existem.
- `GET /api/budgets/suggestions` sugere a média dos últimos 3 meses, arredondada para cima em múltiplos de R$ 10;
  `POST /api/budgets/from-suggestions` cria de uma vez os sugeridos que faltam.

Os alertas são gerados depois de criar ou editar uma transação e, uma única vez, no fim de uma importação (uma
falha nos alertas não derruba a importação). Cada alerta tem uma chave única e nunca se repete, mesmo depois de
lido ou excluído:

| Alerta | Quando |
| ------ | ------ |
| Orçamento em atenção / estourado | Ao passar de 80% e de 100%, uma vez por orçamento para cada nível |
| Orçamento pode estourar | A projeção passa do limite (a partir do dia 5 do mês) |
| Despesa acima do normal | Mais de 3x a média da categoria nos últimos 3 meses (mínimo de 3 despesas e de R$ 50) |
| Nova cobrança recorrente | Uma cobrança completa 3 meses seguidos |
| Recorrente mudou de valor | Diferença de mais de 5% em relação à última cobrança |

## Categorização por IA (opcional)

Na importação, cada lançamento recebe a categoria nesta ordem: **regras** do usuário, **memória** das escolhas
anteriores e, só para o que sobrou, a **IA** (API da Anthropic, modelo `claude-haiku-4-5-20251001` por padrão).
A IA apenas sugere; nada é gravado sem a revisão.

- **Chave:** `ANTHROPIC_API_KEY` no `backend/.env`. Sem ela, a importação segue normalmente e o preview avisa que a IA
  não está disponível. A chave nunca vai para o frontend nem para os logs.
- **Preferência:** desligada por padrão. Em **Configurações** ela só liga depois de o usuário aceitar o aviso de envio
  (o servidor exige a confirmação). Enviamos à API somente descrição, valor e tipo de cada lançamento, sem nome, e-mail,
  conta, saldo ou identificadores do banco.
- **Economia:** descrições iguais (depois de normalizadas) são classificadas uma vez só, em lotes de 50, com até 3 lotes
  em paralelo. Duplicadas nem são enviadas. Cada chamada tem tempo limite (`AI_TIMEOUT_MS`) e até 2 novas tentativas
  em erros temporários; no máximo `AI_MAX_TRANSACTIONS` lançamentos por importação.
- **Validação:** cada resposta é conferida com Zod. Categoria que não é do usuário ou de tipo diferente do lançamento
  é descartada; confiança BAIXA fica sem categoria.
- **Memória:** a categoria confirmada pelo usuário é lembrada pela descrição normalizada (sem acento, parcela ou código).
  Uma escolha manual sempre substitui a anterior.
- **Origem:** cada transação guarda de onde veio a categoria (`MANUAL`, `REGRA`, `MEMORIA`, `IA`).
- **Trocar de provedor:** a integração fica em `backend/src/services/ai/`, atrás da interface `Categorizer`.

Trocar a variável `AI_MODEL` muda o modelo sem mexer no código.

## Importação de extrato (OFX e CSV)

A importação tem duas etapas, para o usuário revisar antes de gravar:

1. `POST /api/import/preview` (multipart: `arquivo` + `accountId`; até 5 MB, só `.ofx` e `.csv`) lê o arquivo e
   devolve as transações encontradas, com a categoria sugerida pelas regras e a marca `duplicada` para o que já
   existe na conta. Nada é gravado.
2. `POST /api/import/confirm` (`accountId` + lista revisada) grava tudo em uma transação do banco e ignora
   as duplicadas.

- **CSV:** a primeira chamada do preview devolve os cabeçalhos e as primeiras linhas (`etapa: "mapeamento"`);
  envie o arquivo de novo com o campo `mapeamento` (JSON com os índices das colunas: `data`, `descricao` e
  `valor`, ou `entrada`/`saida`). O separador (`;`, `,` ou tab) é detectado automaticamente.
- **Codificação:** UTF-8 ou windows-1252 (latin1), detectada automaticamente.
- **Valores:** convertidos para centavos sem passar por ponto flutuante; aceita `1.234,56` e `1234.56`.
- **Duplicatas:** o OFX usa o `FITID` do banco como identificador; o CSV, um hash de data + valor + descrição +
  posição entre linhas iguais no mesmo dia. Reimportar o mesmo arquivo na mesma conta importa zero.

Há extratos fictícios para teste em [backend/samples](backend/samples/).

## Regras de categorização

Uma regra liga uma palavra-chave a uma categoria. A comparação ignora maiúsculas e acentos, só vale para
transações do mesmo tipo (despesa/receita) da categoria e, quando mais de uma regra serve, vence a palavra-chave
mais longa. Palavras-chave de até 3 caracteres (como `99`) só casam como palavra inteira.

Todo usuário novo recebe regras padrão para nomes comuns no Brasil (iFood, Uber, Netflix, farmácia, posto etc.);
o `yarn seed` repõe as que faltarem no usuário de teste. `POST /api/category-rules/apply` aplica as regras às
transações que estão sem categoria.

No frontend, o token fica no `localStorage`; rotas da área logada redirecionam para `/login` sem sessão.
