# ==========================================
# STAGE 1: Build & Dependencies
# ==========================================
FROM node:20-slim AS builder
WORKDIR /app

# Cài đặt OpenSSL (cần thiết cho Prisma trên Linux)
RUN apt-get update -y && apt-get install -y openssl

# Cài đặt dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install

# Tạo Prisma Client và build mã nguồn NestJS
COPY . .
RUN npx prisma generate
RUN npm run build

# ==========================================
# STAGE 2: Production Runtime
# ==========================================
FROM node:20-slim AS runner
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=0611

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./

EXPOSE 0611

CMD ["node", "dist/main"]
