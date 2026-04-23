# syntax=docker/dockerfile:1.7
# Multi-stage production image for the Next.js 15 (App Router) app.
#
# Pipeline perf Tier 2 goals:
#   - Deploy time 10m -> 3-5m (pnpm store + .next/cache BuildKit mounts).
#   - Smaller runtime image (~150MB vs ~500MB) via next.config `output: "standalone"`.
#   - Deterministic Chromium install for the catalog-PDF Puppeteer route.
#   - Source-map upload to Sentry (builder ARG, not leaked into runner layer).
#
# Layer order is deliberate: package manifests come BEFORE the rest of the
# source so deps-layer cache survives source-only edits.
# -----------------------------------------------------------------------------

ARG NODE_VERSION=22.22.2
ARG PNPM_VERSION=9.15.9

# ---- base: shared runtime base with corepack + pnpm ------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS base
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV NEXT_TELEMETRY_DISABLED=1
ENV PUPPETEER_SKIP_DOWNLOAD=1
ARG PNPM_VERSION
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

# ---- deps: install dependencies once; cached across source-only changes ----
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store,id=pnpm-store \
    pnpm install --frozen-lockfile --prefer-offline

# ---- builder: run next build with Sentry source-map upload -----------------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time env: zod schemas in lib/env{,.client}.ts fail hard if any required
# NEXT_PUBLIC_* or server secret is missing, so Coolify must pass each of these
# through as --build-arg. All default to "" so local `docker build` prints a
# clear zod error instead of a cryptic shell failure.
ARG NEXT_PUBLIC_SUPABASE_URL=""
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=""
ARG NEXT_PUBLIC_SITE_URL=""
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY=""
ARG NEXT_PUBLIC_PLAUSIBLE_DOMAIN=""
ARG NEXT_PUBLIC_PLAUSIBLE_HOST=""
ARG NEXT_PUBLIC_SENTRY_DSN=""
ARG SUPABASE_SERVICE_ROLE_KEY=""
ARG TURNSTILE_SECRET_KEY=""
ARG RESEND_API_KEY=""
ARG RESEND_FROM_EMAIL=""
ARG RESEND_TEAM_EMAIL=""
ARG CATALOG_TEMPLATE_SECRET=""
# Sentry auth token is builder-stage-only (never copied into runner), so
# `docker history` on the final image does not expose it.
ARG SENTRY_AUTH_TOKEN=""

ENV NODE_ENV=production
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY
ENV NEXT_PUBLIC_PLAUSIBLE_DOMAIN=$NEXT_PUBLIC_PLAUSIBLE_DOMAIN
ENV NEXT_PUBLIC_PLAUSIBLE_HOST=$NEXT_PUBLIC_PLAUSIBLE_HOST
ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
ENV TURNSTILE_SECRET_KEY=$TURNSTILE_SECRET_KEY
ENV RESEND_API_KEY=$RESEND_API_KEY
ENV RESEND_FROM_EMAIL=$RESEND_FROM_EMAIL
ENV RESEND_TEAM_EMAIL=$RESEND_TEAM_EMAIL
ENV CATALOG_TEMPLATE_SECRET=$CATALOG_TEMPLATE_SECRET
ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN

RUN --mount=type=cache,target=/app/.next/cache,id=next-cache \
    pnpm build

# ---- runner: minimal runtime image -----------------------------------------
FROM base AS runner
WORKDIR /app

# Chromium for the /api/catalog/[sector]/[lang] PDF endpoint (puppeteer-core).
# Fonts cover Latin + Cyrillic (fonts-liberation) and Arabic + broad Unicode
# (fonts-noto-core). CJK + emoji fonts are intentionally excluded: the app
# has no CJK content (locales are TR/EN/RU/AR), and they add ~350MB.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        chromium \
        ca-certificates \
        fonts-liberation \
        fonts-noto-core \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*

# Next.js standalone output contains only the files needed to run (minimal
# node_modules + compiled server). Public assets and static chunks are copied
# separately since they live outside .next/standalone.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

EXPOSE 3000

# Traefik honors HEALTHCHECK for "wait for ready before routing" during
# deploys; start-period=30s gives Next.js cold start breathing room to
# prevent false-negative flapping. PORT is read from env (Coolify compose
# overrides Dockerfile ENV at runtime, e.g. sets PORT=80), falling back
# to 3000 for local `docker run` without env. 127.0.0.1 avoids IPv6
# resolution ambiguity on dual-stack setups.
HEALTHCHECK --interval=10s --timeout=3s --start-period=30s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
