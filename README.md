# Game Trend Radar Backend

NestJS + Prisma + PostgreSQL MVP backend for the existing Game Trend Radar frontend.

## Scripts

- `npm install`
- `npm run prisma:generate`
- `npm run build`
- `npm run dev`
- `npm run start`

## Environment

Create a `.env` file:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/game_trend_radar?schema=public"
PORT=3000
```

## Local setup

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

The API runs with global prefix `api`, so health check is available at `GET /api/health`.

## Railway deployment

The included `Dockerfile` is ready for Railway. On container startup it runs:

```bash
npx prisma db push && node dist/main.js
```

## Implemented endpoints

- `GET /api/health`
- `GET /api/trend/exploding`
- `GET /api/trend/early`
- `GET /api/trend/all`
- `GET /api/new-words`
- `POST /api/new-words/analyze`
- `POST /api/new-words/reset`
- `POST /api/new-words/clear`
- `GET /api/daily-job`
- `POST /api/daily-job`
- `POST /api/daily-job/clear`
- `POST /api/system/reset`
