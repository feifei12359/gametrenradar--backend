CREATE TABLE IF NOT EXISTS "keyword_aliases" (
  "id" TEXT NOT NULL,
  "keyword_id" TEXT NOT NULL,
  "raw_text" TEXT NOT NULL,
  "source" "SignalSource" NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "keyword_aliases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "historical_keyword_stats" (
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

CREATE UNIQUE INDEX IF NOT EXISTS "keyword_aliases_keyword_id_raw_text_key"
ON "keyword_aliases"("keyword_id", "raw_text");

CREATE INDEX IF NOT EXISTS "keyword_aliases_raw_text_idx"
ON "keyword_aliases"("raw_text");

CREATE UNIQUE INDEX IF NOT EXISTS "historical_keyword_stats_canonical_name_region_key"
ON "historical_keyword_stats"("canonical_name", "region");

CREATE INDEX IF NOT EXISTS "historical_keyword_stats_region_is_legacy_keyword_idx"
ON "historical_keyword_stats"("region", "is_legacy_keyword");
