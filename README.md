# Early Roblox Game Discovery System

NestJS + Prisma backend for discovering early-stage Roblox game keywords before they fully explode.

## What Changed

The backend is now optimized for:

- `NEW`: first seen within 72 hours and still low-player
- `EARLY`: accelerating mentions with low Roblox player count
- `EXPLODING`: already validated breakout terms

The ranking logic now prioritizes:

- `newness_score`
- `acceleration_score`
- `validation_score`

instead of pure aggregate heat.

## Signal Sources

1. YouTube discovery crawl
2. Roblox validation
3. Google Trends validation

YouTube is the primary discovery source. Roblox and Trends are validation layers.

## Supported Regions

- `US`
- `CA`
- `UK`
- `AU`
- `NZ`
- `DE`
- `NL`
- `SE`
- `NO`
- `DK`

Default region is `US`.

## Data Model

New core tables:

- `keywords`
- `keyword_aliases`
- `youtube_signals`
- `roblox_validations`
- `trends_validations`
- `keyword_scores`
- `historical_keyword_stats`
- `generic_keyword_samples`

Legacy tables `Trend` and `NewWord` were kept in Prisma for compatibility with old files.

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `YOUTUBE_API_KEY`: YouTube Data API v3 key
- `ROBLOX_VALIDATION_MODE`: set to `live` to use Roblox API provider, otherwise mock provider is used
- `PORT`: optional server port

## Install

```bash
npm install
npx prisma generate
npx prisma db push
npm run build
```

## Run

```bash
npm run start
```

## Main APIs

- `GET /api/discovery/new?region=US`
- `GET /api/discovery/early?region=US`
- `GET /api/discovery/exploding?region=US`
- `GET /api/discovery/keyword/:id`
- `GET /api/discovery/regions/summary`
- `GET /api/discovery/debug/generic-keywords?region=US`
- `POST /api/discovery/run?region=US`

## Cron Jobs

- `youtube-region-crawl.job.ts`: every 6 hours
- `keyword-score-recompute.job.ts`: every 4 hours
- `keyword-stage-refresh.job.ts`: every 8 hours

## Frontend Integration Notes

The frontend repository is not present in this workspace. The backend now exposes region-aware discovery endpoints intended for:

- Region filter
- Stage filter
- Time window filter
- Keyword detail view

Recommended frontend entry state:

- region = `US`
- stage = `NEW`
- window = `72h`

## Key Files

- `prisma/schema.prisma`
- `src/modules/discovery/discovery.controller.ts`
- `src/modules/discovery/discovery.service.ts`
- `src/services/discovery-pipeline.service.ts`
- `src/services/keyword-extraction.service.ts`
- `src/services/keyword-scoring.service.ts`
- `src/services/youtube-crawler.service.ts`
- `src/services/roblox-validation.service.ts`
- `src/services/trends-validation.service.ts`
- `src/modules/keywords/keyword.repository.ts`
