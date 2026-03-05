# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base
USER node
WORKDIR /app

FROM base AS deps
COPY --chown=node:node package.json package-lock.json* ./
RUN npm ci

FROM base AS dev
COPY --chown=node:node --from=deps /app/node_modules ./node_modules
COPY --chown=node:node . .
EXPOSE 5173
CMD ["npx", "vite", "--host", "0.0.0.0"]

FROM base AS test
COPY --chown=node:node --from=deps /app/node_modules ./node_modules
COPY --chown=node:node . .
CMD ["npx", "vitest", "run"]
