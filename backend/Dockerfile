# syntax=docker/dockerfile:1
# Imagem do backend. O contexto de build é a RAIZ do repositório (monorepo com Yarn workspaces):
#   docker build -f backend/Dockerfile -t moedy-backend .

FROM node:22-slim AS base
# O Prisma precisa do OpenSSL; os certificados permitem conexão TLS com o banco.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ENV YARN_ENABLE_TELEMETRY=0
WORKDIR /app
# Só o que define as dependências, para o cache do Docker sobreviver a mudanças de código.
# O schema do Prisma entra aqui porque o postinstall do backend roda `prisma generate`.
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/releases .yarn/releases
COPY backend/package.json backend/prisma.config.ts backend/
COPY backend/prisma backend/prisma
COPY frontend/package.json frontend/

# --- deps: todas as dependências do backend (inclui TypeScript e tsx). Também serve ao docker-compose de dev.
FROM base AS deps
RUN yarn workspaces focus backend

# --- build: gera o Prisma Client e compila o TypeScript para dist/
FROM deps AS build
COPY backend backend
RUN yarn workspace backend build

# --- prod-deps: só as dependências de produção
FROM base AS prod-deps
RUN yarn workspaces focus backend --production

# --- run: imagem final
FROM node:22-slim AS run
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production \
    PORT=3333 \
    PATH=/app/node_modules/.bin:$PATH
WORKDIR /app
COPY --from=prod-deps --chown=node:node /app/node_modules node_modules
COPY --from=prod-deps --chown=node:node /app/backend backend
COPY --from=build --chown=node:node /app/backend/dist backend/dist
COPY --chown=node:node --chmod=755 backend/docker-entrypoint.sh backend/docker-entrypoint.sh

WORKDIR /app/backend
USER node
EXPOSE 3333
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3333) + '/api/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
ENTRYPOINT ["./docker-entrypoint.sh"]
