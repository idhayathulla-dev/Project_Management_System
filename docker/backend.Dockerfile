# Stage 1: Build the backend application
FROM node:20-alpine AS builder

# Install OpenSSL for Prisma engine compatibility on Alpine
RUN apk add --no-cache openssl

WORKDIR /app

# Copy the Prisma schema first (located in the monorepo root)
COPY prisma ./prisma

# Copy the server dependencies
COPY server/package*.json ./server/

# Install all dependencies (development dependencies are required to compile TypeScript)
RUN cd server && npm ci

# Copy server code
COPY server ./server

# Generate Prisma Client and build TypeScript files
RUN cd server && npm run db:generate
RUN cd server && npm run build

# Stage 2: Production runner
FROM node:20-alpine

# Install OpenSSL for Prisma engine compatibility on Alpine
RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production

# Copy necessary production artifacts from the builder
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/package*.json ./server/
COPY --from=builder /app/server/node_modules ./server/node_modules

EXPOSE 5000

WORKDIR /app/server

# Start script: Run migrations, verify schema status, and run the server
CMD ["sh", "-c", "npx prisma migrate deploy --schema=../prisma/schema.prisma && npx prisma migrate status --schema=../prisma/schema.prisma && npm start"]
