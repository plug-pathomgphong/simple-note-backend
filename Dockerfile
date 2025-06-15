# Stage 1: Build the NestJS app
FROM node:20-alpine AS builder

WORKDIR /app

# ติดตั้ง dev deps ด้วย
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./
RUN npx prisma generate && npx prisma migrate deploy

CMD ["node", "dist/main"]