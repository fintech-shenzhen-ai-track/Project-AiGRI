FROM node:24-alpine
WORKDIR /app
# Pinned in package.json ("packageManager"); the lockfile is committed.
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build
ENV NODE_ENV=production
# The compose healthcheck calls /health (app/health/route.ts).
CMD ["pnpm", "start"]
