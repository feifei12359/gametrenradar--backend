FROM node:20-bullseye

WORKDIR /app

ARG CACHE_BUST=1
ENV NODE_ENV=production

RUN apt-get update -y && apt-get install -y openssl ca-certificates

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
COPY tsconfig*.json ./
COPY src ./src

RUN echo "BUILD_MARK=2026-03-13-youtube-debug-v1"
RUN npx prisma generate
RUN npm run build

EXPOSE 8080

CMD ["sh", "-c", "npx prisma db push && node dist/main.js"]
