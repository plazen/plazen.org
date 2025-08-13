# Dockerfile for Plazen
FROM node:22-alpine AS base-stage

FROM base-stage AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
COPY ./prisma ./prisma

RUN npm install

FROM base-stage AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate

RUN npm run build

FROM base-stage AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "start"]
