CREATE TYPE "RegionCode" AS ENUM ('GLOBAL', 'US', 'CA', 'UK', 'AU', 'NZ', 'DE', 'NL', 'SE', 'NO', 'DK');
CREATE TYPE "KeywordStage" AS ENUM ('NEW', 'EARLY', 'EXPLODING', 'FILTERED');
CREATE TYPE "SignalSource" AS ENUM ('YOUTUBE', 'ROBLOX', 'TRENDS', 'SYSTEM');

CREATE TABLE "keywords" (
  "id" TEXT NOT NULL,
  "canonical_name" TEXT NOT NULL,
  "display_name" TEXT NOT NULL,
  "first_seen_at" TIMESTAMP(3) NOT NULL,
  "last_seen_at" TIMESTAMP(3) NOT NULL,
  "region" "RegionCode" NOT NULL,
  "signal_count" INTEGER NOT NULL DEFAULT 0,
  "youtube_signal_count" INTEGER NOT NULL DEFAULT 0,
  "roblox_signal_count" INTEGER NOT NULL DEFAULT 0,
  "trends_signal_count" INTEGER NOT NULL DEFAULT 0,
  "is_generic" BOOLEAN NOT NULL DEFAULT false,
  "stage" "KeywordStage" NOT NULL DEFAULT 'NEW',
  "competition_score" DOUBLE PRECISION NOT NULL DEFAULT 50,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "keywords_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "keyword_aliases" (
  "id" TEXT NOT NULL,
  "keyword_id" TEXT NOT NULL,
  "raw_text" TEXT NOT NULL,
  "source" "SignalSource" NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "keyword_aliases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "youtube_signals" (
  "id" TEXT NOT NULL,
  "keyword_id" TEXT,
  "region" "RegionCode" NOT NULL,
  "video_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "channel_title" TEXT NOT NULL,
  "thumbnail_url" TEXT,
  "published_at" TIMESTAMP(3) NOT NULL,
  "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "view_count" INTEGER NOT NULL DEFAULT 0,
  "like_count" INTEGER NOT NULL DEFAULT 0,
  "comment_count" INTEGER NOT NULL DEFAULT 0,
  "query_term" TEXT NOT NULL,
  "keyword_raw" TEXT NOT NULL,
  CONSTRAINT "youtube_signals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "roblox_validations" (
  "id" TEXT NOT NULL,
  "keyword_id" TEXT NOT NULL,
  "region" "RegionCode" NOT NULL,
  "roblox_game_id" TEXT,
  "game_name" TEXT NOT NULL,
  "players" INTEGER,
  "favorites" INTEGER,
  "visits" INTEGER,
  "validated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "roblox_validations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "trends_validations" (
  "id" TEXT NOT NULL,
  "keyword_id" TEXT NOT NULL,
  "region" "RegionCode" NOT NULL,
  "score" DOUBLE PRECISION NOT NULL,
  "source_window" TEXT NOT NULL,
  "validated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "trends_validations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "keyword_scores" (
  "id" TEXT NOT NULL,
  "keyword_id" TEXT NOT NULL,
  "region" "RegionCode" NOT NULL,
  "newness_score" DOUBLE PRECISION NOT NULL,
  "acceleration_score" DOUBLE PRECISION NOT NULL,
  "validation_score" DOUBLE PRECISION NOT NULL,
  "trend_score" DOUBLE PRECISION NOT NULL,
  "opportunity_score" DOUBLE PRECISION NOT NULL,
  "competition_score" DOUBLE PRECISION NOT NULL DEFAULT 50,
  "stage" "KeywordStage" NOT NULL,
  "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "mentions_last_24h" INTEGER NOT NULL DEFAULT 0,
  "mentions_prev_24h" INTEGER NOT NULL DEFAULT 0,
  "youtube_views_24h" INTEGER NOT NULL DEFAULT 0,
  "youtube_video_count" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "keyword_scores_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "historical_keyword_stats" (
  "id" TEXT NOT NULL,
  "canonical_name" TEXT NOT NULL,
  "region" "RegionCode" NOT NULL,
  "first_seen_at" TIMESTAMP(3) NOT NULL,
  "last_seen_at" TIMESTAMP(3) NOT NULL,
  "total_mentions_7d" INTEGER NOT NULL DEFAULT 0,
  "total_mentions_30d" INTEGER NOT NULL DEFAULT 0,
  "total_mentions_90d" INTEGER NOT NULL DEFAULT 0,
  "total_regions" INTEGER NOT NULL DEFAULT 0,
  "is_legacy_keyword" BOOLEAN NOT NULL DEFAULT false,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "historical_keyword_stats_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "generic_keyword_samples" (
  "id" TEXT NOT NULL,
  "region" "RegionCode" NOT NULL,
  "raw_text" TEXT NOT NULL,
  "normalized_text" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "source_title" TEXT NOT NULL,
  "query_term" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "generic_keyword_samples_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "keywords_canonical_name_region_key" ON "keywords"("canonical_name", "region");
CREATE UNIQUE INDEX "keyword_aliases_keyword_id_raw_text_key" ON "keyword_aliases"("keyword_id", "raw_text");
CREATE UNIQUE INDEX "youtube_signals_region_video_id_keyword_raw_query_term_key" ON "youtube_signals"("region", "video_id", "keyword_raw", "query_term");
CREATE UNIQUE INDEX "historical_keyword_stats_canonical_name_region_key" ON "historical_keyword_stats"("canonical_name", "region");

CREATE INDEX "keywords_region_stage_idx" ON "keywords"("region", "stage");
CREATE INDEX "keywords_first_seen_at_idx" ON "keywords"("first_seen_at");
CREATE INDEX "keyword_aliases_raw_text_idx" ON "keyword_aliases"("raw_text");
CREATE INDEX "youtube_signals_keyword_id_published_at_idx" ON "youtube_signals"("keyword_id", "published_at");
CREATE INDEX "youtube_signals_region_published_at_idx" ON "youtube_signals"("region", "published_at");
CREATE INDEX "roblox_validations_keyword_id_validated_at_idx" ON "roblox_validations"("keyword_id", "validated_at");
CREATE INDEX "roblox_validations_region_validated_at_idx" ON "roblox_validations"("region", "validated_at");
CREATE INDEX "trends_validations_keyword_id_validated_at_idx" ON "trends_validations"("keyword_id", "validated_at");
CREATE INDEX "trends_validations_region_validated_at_idx" ON "trends_validations"("region", "validated_at");
CREATE INDEX "keyword_scores_keyword_id_calculated_at_idx" ON "keyword_scores"("keyword_id", "calculated_at");
CREATE INDEX "keyword_scores_region_stage_trend_score_idx" ON "keyword_scores"("region", "stage", "trend_score");
CREATE INDEX "historical_keyword_stats_region_is_legacy_keyword_idx" ON "historical_keyword_stats"("region", "is_legacy_keyword");
CREATE INDEX "generic_keyword_samples_region_created_at_idx" ON "generic_keyword_samples"("region", "created_at");

ALTER TABLE "keyword_aliases"
ADD CONSTRAINT "keyword_aliases_keyword_id_fkey"
FOREIGN KEY ("keyword_id") REFERENCES "keywords"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "youtube_signals"
ADD CONSTRAINT "youtube_signals_keyword_id_fkey"
FOREIGN KEY ("keyword_id") REFERENCES "keywords"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "roblox_validations"
ADD CONSTRAINT "roblox_validations_keyword_id_fkey"
FOREIGN KEY ("keyword_id") REFERENCES "keywords"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "trends_validations"
ADD CONSTRAINT "trends_validations_keyword_id_fkey"
FOREIGN KEY ("keyword_id") REFERENCES "keywords"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "keyword_scores"
ADD CONSTRAINT "keyword_scores_keyword_id_fkey"
FOREIGN KEY ("keyword_id") REFERENCES "keywords"("id") ON DELETE CASCADE ON UPDATE CASCADE;
