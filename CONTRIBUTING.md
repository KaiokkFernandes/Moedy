# Fluxo de trabalho

Toda mudança entra na `main` por pull request, e o pull request só pode ser mergeado com o CI verde.

## Regras

- **Nunca commitar direto na `main`.** Todo trabalho começa numa branch nova a partir da `main` atualizada
  e chega por pull request.
- **Toda feature ou correção vem com testes.** A lógica nova ganha testes unitários no mesmo pull request
  (arquivo `.test.ts` ao lado do código). Correção de bug vem com o teste que reproduz o bug.
- **O CI verde é obrigatório.** Lint sem avisos, typecheck, testes com a cobertura mínima e build.

## O dia a dia

1. Crie uma branch a partir da `main` atualizada:

   ```bash
   git checkout main && git pull
   git checkout -b feat/nome-da-mudanca     # ou fix/, chore/, docs/, test/, ci/
   ```

2. Faça commits pequenos, no padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/), em
   português: `feat(frontend): ...`, `fix(backend): ...`, `test: ...`, `docs: ...`.
3. Antes de enviar, rode localmente o mesmo que o CI roda:

   ```bash
   yarn lint             # oxlint no backend e no frontend; qualquer aviso falha
   yarn typecheck        # TypeScript nos dois workspaces
   yarn test:coverage    # testes unitários com cobertura mínima
   yarn build            # build de produção
   ```

4. Envie a branch e abra o pull request:

   ```bash
   git push -u origin feat/nome-da-mudanca
   ```

5. Espere o check **CI ok** ficar verde e faça o merge.

## O que o CI verifica

O workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) roda em todo pull request e em cada push
na `main`:

| Job | O que faz |
| --- | --------- |
| **Lint** | `yarn lint`: oxlint no backend e no frontend, sem tolerar avisos |
| **Typecheck** | `yarn typecheck` |
| **Testes unitários** | `yarn test:coverage`: falha se um teste quebrar ou se a cobertura cair abaixo do mínimo. A tabela de cobertura aparece no resumo da execução |
| **Build** | `yarn build` do backend e do frontend |
| **Imagem Docker do backend** | Confere que o `backend/Dockerfile` constrói (nada é publicado) |
| **CI ok** | Passa só se todos os anteriores passaram. É o check exigido para o merge |

Um push novo no mesmo pull request cancela a verificação anterior.

## Testes

Os testes usam o executor nativo do Node (`node:test`) com `tsx`, sem framework extra. Ficam ao lado do
código, com o sufixo `.test.ts`:

```bash
yarn test                                  # todos
yarn workspace backend test                # só o backend
node --import tsx --test src/lib/dates.test.ts   # um arquivo (dentro do workspace)
```

- **Backend:** lógica pura (datas, valores, leitura de OFX e CSV, regras de categorização, validação do
  token do Google) e o app HTTP sem banco (erros, autenticação, CORS, cabeçalhos). Os testes não precisam
  de banco nem de `.env`.
- **Frontend:** utilitários de `src/lib` (formatação, períodos, validação, cliente da API) e as regras do
  `vercel.json`.
- **Relógio e fuso:** testes que dependem da data usam o relógio simulado do `node:test`
  (`mock.timers`), e o resultado é o mesmo em qualquer fuso. O CI roda em UTC.

**Cobertura mínima** (definida no script `test:coverage` de cada workspace):

| Workspace | Linhas | Desvios | Funções |
| --------- | ------ | ------- | ------- |
| backend | 70% | 90% | 50% |
| frontend | 90% | 90% | 85% |

Ao adicionar testes, suba esses números para perto dos valores atuais, assim a cobertura não volta a cair.

Ainda não cobertos: os services do backend que dependem do banco (pedem testes de integração com
PostgreSQL) e os componentes React (pedem testes de interface).

## Proteger a `main` no GitHub

Isto é configuração do repositório, feita uma vez pelo dono, no GitHub:

1. Em **Settings → Rules → Rulesets**, clique em **New ruleset → New branch ruleset**.
2. **Ruleset name:** `Proteger main`. **Enforcement status:** **Active**.
3. **Target branches:** **Add target → Include default branch**.
4. Marque as regras:
   - **Restrict deletions**;
   - **Require a pull request before merging**, com **Required approvals** em `0` (com uma pessoa só no
     projeto, você não conseguiria aprovar o próprio PR);
   - **Require status checks to pass**: clique em **Add checks** e escolha **CI ok**. Ele só aparece na
     lista depois de rodar pelo menos uma vez, então abra um pull request antes. Marque também
     **Require branches to be up to date before merging**, para o CI rodar sobre a versão mais nova da `main`;
   - **Block force pushes**.
5. Clique em **Create**.

A partir daí, o botão de merge fica bloqueado até o **CI ok** passar, e ninguém envia direto para a
`main`. Para emergências, você pode se colocar em **Bypass list**, mas o ideal é não usar.
