-- CreateTable
CREATE TABLE "Trend" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "prediction_score" DOUBLE PRECISION NOT NULL,
    "growth_rate" DOUBLE PRECISION NOT NULL,
    "acceleration" DOUBLE PRECISION NOT NULL,
    "platform_score" DOUBLE PRECISION NOT NULL,
    "ai_score" DOUBLE PRECISION NOT NULL,
    "platforms" TEXT NOT NULL,
    "first_seen_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trend_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Trend_keyword_key" ON "Trend"("keyword");

-- CreateTable
CREATE TABLE "NewWord" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "novelty_score" DOUBLE PRECISION NOT NULL,
    "recent_count" INTEGER NOT NULL,
    "total_count" INTEGER NOT NULL,
    "first_seen_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewWord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NewWord_token_key" ON "NewWord"("token");
