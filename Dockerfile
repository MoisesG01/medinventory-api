# Stage 1: Build
FROM node:22-alpine AS builder

# Install dumb-init and apply security updates
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

# npm bundles picomatch <4.0.4 (CVE-2026-33671 ReDoS); replace until official node image updates.
ARG PICOMATCH_VERSION=4.0.4
RUN NPM_PIC="/usr/local/lib/node_modules/npm/node_modules/picomatch" && \
    rm -rf "$NPM_PIC" && mkdir -p "$NPM_PIC" && \
    wget -qO- "https://registry.npmjs.org/picomatch/-/picomatch-${PICOMATCH_VERSION}.tgz" \
      | tar xz -C "$NPM_PIC" --strip-components=1

WORKDIR /app

# Copy package files (include yarn.lock for consistency)
COPY package*.json yarn.lock ./
COPY prisma/ ./prisma/

# Install dependencies using yarn (include dev deps for build)
RUN yarn install --frozen-lockfile && \
    yarn cache clean

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN yarn build

# Stage 2: Production
FROM node:22-alpine AS production

# Install dumb-init for proper signal handling and apply security updates
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

ARG PICOMATCH_VERSION=4.0.4
RUN NPM_PIC="/usr/local/lib/node_modules/npm/node_modules/picomatch" && \
    rm -rf "$NPM_PIC" && mkdir -p "$NPM_PIC" && \
    wget -qO- "https://registry.npmjs.org/picomatch/-/picomatch-${PICOMATCH_VERSION}.tgz" \
      | tar xz -C "$NPM_PIC" --strip-components=1

# Create app user (Alpine syntax)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

WORKDIR /app

# Copy package files
COPY package*.json yarn.lock ./

# Install production dependencies + Prisma CLI (needed for migrations).
# Pin Prisma to the same major as package.json — Prisma 7+ breaks migrate with this schema.
RUN yarn install --frozen-lockfile --production=true && \
    yarn add -D prisma@6.9.0 && \
    yarn cache clean

# Copy built application and Prisma files
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Copy entrypoint script
COPY --chown=nestjs:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Switch to non-root user
USER nestjs

# App Service injects PORT=8080; default the image the same way for health checks.
EXPOSE 8080

ENV NODE_ENV=production
ENV PORT=8080

# Health check (must match PORT — Azure uses 8080)
HEALTHCHECK --interval=30s --timeout=3s --start-period=90s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||8080)+'/health', (res) => { \
        res.statusCode === 200 ? process.exit(0) : process.exit(1) \
    }).on('error', () => process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]

# Invoke via /bin/sh so CRLF or missing +x on the script cannot break startup (Alpine/Linux).
CMD ["/bin/sh", "/app/docker-entrypoint.sh"]