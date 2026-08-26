# Studio — Next.js 16 standalone build per studio.kyronedu.it.
# Stack identico a Kyron CMS / kyron-ecommerce per coerenza Coolify.

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# @studiofuturo/studio-core e' privato su GitHub Packages: serve un token
# read:packages. Su Coolify e' una Build Variable chiamata NPM_TOKEN.
ARG NPM_TOKEN
RUN printf '@studiofuturo:registry=https://npm.pkg.github.com\n//npm.pkg.github.com/:_authToken=%s\n' "$NPM_TOKEN" > .npmrc \
  && npm ci --include=dev \
  && rm -f .npmrc

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3010
ENV PORT=3010 HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
