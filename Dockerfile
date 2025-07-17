# Build Stage
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm install

COPY . .
RUN npm run build
RUN npx prisma generate

# Run Stage
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
# Copy generated Prisma Client
COPY --from=builder /app/generated ./generated

COPY entrypoint.sh entrypoint.sh
RUN chmod +x entrypoint.sh

EXPOSE 3000
CMD ["sh", "entrypoint.sh"]