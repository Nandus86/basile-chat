# Node 24 (LTS); Node 20 não recebe mais correções de segurança
FROM node:24-alpine AS builder

WORKDIR /app

# Install libc6-compat to fix SWC Turbopack native bindings on Alpine Linux
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
RUN npm ci

ARG NEXT_PUBLIC_API_BASE
ARG NEXT_PUBLIC_WS_BASE
ENV NEXT_PUBLIC_API_BASE=$NEXT_PUBLIC_API_BASE
ENV NEXT_PUBLIC_WS_BASE=$NEXT_PUBLIC_WS_BASE

# Os endereços do mensageiro ficam gravados no app durante o build: sem eles o login não funciona
RUN case "$NEXT_PUBLIC_API_BASE" in http://?*|https://?*) ;; \
      *) echo "ERRO: NEXT_PUBLIC_API_BASE precisa ser o endereço do mensageiro (ex.: https://...easypanel.host). Veio: '$NEXT_PUBLIC_API_BASE'"; exit 1;; esac && \
    case "$NEXT_PUBLIC_WS_BASE" in ws://?*|wss://?*) ;; \
      *) echo "ERRO: NEXT_PUBLIC_WS_BASE precisa ser o endereço do mensageiro com wss:// (ex.: wss://...easypanel.host). Veio: '$NEXT_PUBLIC_WS_BASE'"; exit 1;; esac

COPY . .
RUN npm run build

FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "run", "start"]
