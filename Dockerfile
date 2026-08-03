# ============================================================
# CreatorOS — Multi-stage Docker build
# Uses Bun runtime + Next.js standalone output + SQLite
# ============================================================

# ---------- Stage 1: Install dependencies ----------
FROM oven/bun:1 AS deps
WORKDIR /app

# Copy lockfiles first for better layer caching
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# ---------- Stage 2: Build the app ----------
FROM oven/bun:1 AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma client
RUN bunx prisma generate

# Build Next.js (produces .next/standalone)
RUN bun run build

# ---------- Stage 3: Production runtime ----------
FROM oven/bun:1 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3007
ENV HOSTNAME=0.0.0.0

# Run as numeric UID/GID so we don't depend on adduser/addgroup
# (Debian 13/trixie bases dropped the adduser package; see oven-sh/bun#25441)
COPY --from=builder --chown=1001:1001 /app/.next/standalone ./
# Copy static assets
COPY --from=builder --chown=1001:1001 /app/.next/static ./.next/static
# Copy public assets
COPY --from=builder --chown=1001:1001 /app/public ./public
# Copy Prisma schema + generated client
COPY --from=builder --chown=1001:1001 /app/prisma ./prisma
COPY --from=builder --chown=1001:1001 /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=1001:1001 /app/node_modules/@prisma ./node_modules/@prisma
# Copy Prisma CLI for db push on startup
COPY --from=builder --chown=1001:1001 /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=1001:1001 /app/node_modules/.bin ./node_modules/.bin

# Copy entrypoint script
COPY --chown=1001:1001 --chmod=755 docker-entrypoint.sh /app/docker-entrypoint.sh

# Create data directory for SQLite database (persisted via volume)
RUN mkdir -p /app/data && chown 1001:1001 /app/data

USER 1001:1001

EXPOSE 3007

# Default DATABASE_URL points to a volume-persisted SQLite file
ENV DATABASE_URL="file:/app/data/creatoros.db"

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["bun", "server.js"]
