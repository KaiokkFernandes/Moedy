#!/bin/sh
# Build do backend na Vercel. As migrações rodam só no deploy de produção, antes de o código
# novo entrar no ar; se uma falhar, o deploy falha e a versão anterior continua servindo.
# Deploys de preview não tocam no banco.
set -e

yarn build

if [ "$VERCEL_ENV" = "production" ]; then
  if [ -z "$DATABASE_URL_UNPOOLED" ] && [ -z "$DATABASE_URL" ]; then
    echo "" >&2
    echo "Faltam as variáveis do banco: DATABASE_URL (e, com o Neon, DATABASE_URL_UNPOOLED)." >&2
    echo "Cadastre-as em Settings > Environment Variables (ambiente Production) e faça Redeploy." >&2
    echo "Passo a passo: DEPLOY.md, seção \"Banco no Neon\"." >&2
    exit 1
  fi
  echo "Aplicando migrações do banco..."
  yarn migrate:deploy
else
  echo "Deploy de ${VERCEL_ENV:-desenvolvimento}: migrações não aplicadas"
fi
