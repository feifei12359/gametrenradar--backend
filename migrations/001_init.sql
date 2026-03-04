CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS label_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word VARCHAR(256) NOT NULL,
  platform VARCHAR(64) NOT NULL,
  first_seen_at TIMESTAMP NOT NULL,
  last_seen_at TIMESTAMP NOT NULL,
  total_mentions INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_label_sources_word_platform ON label_sources(word, platform);
CREATE TABLE IF NOT EXISTS label_timeseries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label_id UUID NOT NULL REFERENCES label_sources(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  platform VARCHAR(64) NOT NULL,
  mention_count INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_label_timeseries_date_platform ON label_timeseries(date, platform);
CREATE TABLE IF NOT EXISTS label_prediction (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label_id UUID NOT NULL REFERENCES label_sources(id) ON DELETE CASCADE,
  growth_rate FLOAT,
  acceleration FLOAT,
  platform_score FLOAT,
  ai_score FLOAT,
  prediction_score FLOAT,
  status VARCHAR(32),
  calculated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_label_prediction_score ON label_prediction(prediction_score);
