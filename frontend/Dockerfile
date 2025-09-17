FROM docker.io/node:24-alpine AS builder

ENV CI=true \
  NODE_ENV=production \
  PNPM_HOME="/pnpm" \
  PATH="/pnpm:$PATH"

RUN corepack enable

COPY package.json pnpm-lock.yaml /app/
WORKDIR /app
RUN --mount=type=cache,target=/pnpm/store \
  pnpm install

COPY index.html tsconfig.* vite.config.ts /app/
COPY src /app/src
RUN --mount=type=secret,id=VITE_TURNSTILE_SITE_KEY,env=VITE_TURNSTILE_SITE_KEY \
  pnpm run build

FROM docker.io/nginx:1.29-alpine

RUN apk del -r nginx && \
  apk add --no-cache nginx nginx-mod-http-brotli

COPY nginx.conf /etc/nginx/nginx.conf
COPY site.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]
