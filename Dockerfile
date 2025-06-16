# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 2: Prod
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

# COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma 
# COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
# อย่าทำ migrate ตอน build
RUN npx prisma generate
# COPY --from=builder /app/generated ./generated # ถ้ามี
# RUN npx prisma migrate deploy ← ย้ายออก

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]