# syntax=docker/dockerfile:1
# Build context = iris-app/ (local / alternate deploy). Prefer repo-root Dockerfile on Railway.

FROM node:22-bookworm-slim AS deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY server/package.json ./server/
COPY admin/package.json ./admin/
COPY docs-site/package.json ./docs-site/

RUN pnpm install --frozen-lockfile

FROM deps AS build

COPY . .

RUN pnpm build:admin

FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8792
ENV IRIS_DB_PATH=/app/data/iris.db

RUN corepack enable && corepack prepare pnpm@latest --activate \
  && apt-get update \
  && apt-get install -y --no-install-recommends tini \
  && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY server/package.json ./server/
COPY admin/package.json ./admin/
RUN pnpm install --frozen-lockfile --prod --filter @iris/server...

COPY --from=build /app/public ./public
COPY --from=build /app/server/src ./server/src
COPY --from=build /app/server/migrations ./server/migrations

RUN mkdir -p /app/data/media

EXPOSE 8792

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 8792) + '/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "--experimental-strip-types", "server/src/server.ts"]
