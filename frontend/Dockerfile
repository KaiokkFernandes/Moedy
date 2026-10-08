# syntax=docker/dockerfile:1
# Imagem do frontend para uso LOCAL (em produção o frontend vai para a Vercel).
# O contexto de build é a RAIZ do repositório:
#   docker build -f frontend/Dockerfile --build-arg VITE_API_URL=http://localhost:3333 -t moedy-frontend .

FROM node:22-slim AS deps
ENV YARN_ENABLE_TELEMETRY=0
WORKDIR /app
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/releases .yarn/releases
COPY frontend/package.json frontend/
COPY backend/package.json backend/
RUN yarn workspaces focus frontend

# --- build: o endereço da API é fixado no bundle nesta etapa
FROM deps AS build
ARG VITE_API_URL=http://localhost:3333
ENV VITE_API_URL=$VITE_API_URL
COPY frontend frontend
RUN yarn workspace frontend build

# --- run: nginx sem root, na porta 8080
FROM nginxinc/nginx-unprivileged:stable-alpine AS run
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
