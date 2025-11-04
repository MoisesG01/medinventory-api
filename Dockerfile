# Stage 1: Build
FROM node:22-alpine AS builder

# Install dumb-init and apply security updates
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

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

# Create app user (Alpine syntax)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

WORKDIR /app

# Copy package files
COPY package*.json yarn.lock ./

# Install production dependencies + Prisma CLI (needed for migrations)
RUN yarn install --frozen-lockfile --production=true && \
    yarn add -D prisma && \
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

# Expose port
EXPOSE 3000

# Environment variables
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { \
        res.statusCode === 200 ? process.exit(0) : process.exit(1) \
    }).on('error', () => process.exit(1))"

# Use dumb-init for proper signal handling and run entrypoint script
ENTRYPOINT ["dumb-init", "--"]

# Start the application via entrypoint script (runs migrations first)
CMD ["./docker-entrypoint.sh"]