FROM node:20-bullseye

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

RUN apt-get update -y && apt-get install -y openssl ca-certificates
RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 8080

CMD ["sh", "-c", "npx prisma db push && node dist/main.js"]