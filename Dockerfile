# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json yarn.lock ./
RUN corepack enable && yarn install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable \
  && yarn build \
  && yarn build:migrations

FROM base AS runner
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --ingroup nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/dist/db ./dist/db

# Migrations run via `node dist/db/migrate.js` (outside the Next bundle).
RUN npm install --no-save kysely@0.29.6 pg@8.23.1 \
  && chown -R nextjs:nodejs /app/node_modules

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
