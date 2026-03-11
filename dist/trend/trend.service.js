"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TrendService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrendService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const youtube_service_1 = require("../youtube/youtube.service");
const google_trends_service_1 = require("../services/google-trends.service");
let TrendService = TrendService_1 = class TrendService {
    constructor(prisma, youtubeService, googleTrendsService) {
        this.prisma = prisma;
        this.youtubeService = youtubeService;
        this.googleTrendsService = googleTrendsService;
        this.logger = new common_1.Logger(TrendService_1.name);
        this.stopWords = new Set([
            'game', 'games', 'gaming', 'roblox', 'official', 'version',
            'free', 'sale', 'limited', 'offsale', 'item', 'items',
            'merch', 'shirt', 'shirts', 'pants', 'hat', 'hats',
            'black', 'white', 'red', 'blue', 'green', 'yellow',
            'purple', 'orange', 'pink', 'brown', 'gray', 'grey',
            '2024', '2025', '2026',
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at',
            'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is',
            'are', 'was', 'were', 'be', 'been', 'being', 'have',
            'has', 'had', 'do', 'does', 'did', 'will', 'would',
            'should', 'could', 'may', 'might', 'must'
        ]);
        this.edgeNoiseWords = new Set([
            'new', 'update', 'updates', 'guide', 'tips', 'codes', 'code',
            'release', 'trailer', 'gameplay', 'best', 'worst',
            'beginner', 'beginners', 'how', 'unlock', 'getting',
            'play', 'playing', 'review', 'showcase', 'video', 'videos',
            'watch', 'channel'
        ]);
        this.gameHintWords = new Set([
            'simulator', 'tycoon', 'obby', 'defense', 'battle',
            'battlegrounds', 'rpg', 'survival', 'horror', 'shooter',
            'farm', 'idle', 'clicker', 'anime', 'tower', 'racing',
            'strategy', 'soul', 'ball', 'garden', 'rng'
        ]);
    }
    async processTrends() {
        this.logger.log('开始处理 Roblox 游戏趋势');
        const videos = await this.youtubeService.getRobloxVideos(7);
        this.logger.log(`获取到 ${videos.length} 个 Roblox 视频`);
        const gameCandidates = this.extractGameCandidates(videos);
        this.logger.log(`提取到 ${gameCandidates.length} 个游戏名候选`);
        for (const candidate of gameCandidates) {
            try {
                const trendData = await this.googleTrendsService.getTrendData(candidate.gameName);
                const scores = this.calculateScores(candidate, trendData);
                const hasTrendSignal = Number((trendData === null || trendData === void 0 ? void 0 : trendData.score) || 0) > 0 || Number((trendData === null || trendData === void 0 ? void 0 : trendData.growth) || 0) > 0;
                await this.prisma.trend.upsert({
                    where: { keyword: candidate.gameName },
                    update: {
                        prediction_score: scores.predictionScore,
                        growth_rate: scores.growthRate,
                        acceleration: scores.acceleration,
                        platform_score: scores.platformScore,
                        ai_score: scores.aiScore,
                        platforms: hasTrendSignal ? 'youtube,google_trends' : 'youtube'
                    },
                    create: {
                        keyword: candidate.gameName,
                        prediction_score: scores.predictionScore,
                        growth_rate: scores.growthRate,
                        acceleration: scores.acceleration,
                        platform_score: scores.platformScore,
                        ai_score: scores.aiScore,
                        platforms: hasTrendSignal ? 'youtube,google_trends' : 'youtube',
                        first_seen_at: new Date()
                    }
                });
            }
            catch (error) {
                this.logger.error(`处理趋势 ${candidate.gameName} 失败:`, error);
            }
        }
    }
    async getExplodingTrends() {
        return this.prisma.trend.findMany({
            where: { prediction_score: { gt: 70 } },
            orderBy: { prediction_score: 'desc' }
        });
    }
    async getEarlyTrends() {
        return this.prisma.trend.findMany({
            where: {
                prediction_score: {
                    gte: 40,
                    lte: 70
                }
            },
            orderBy: { prediction_score: 'desc' }
        });
    }
    async getAllTrends() {
        return this.prisma.trend.findMany({
            orderBy: { prediction_score: 'desc' }
        });
    }
    async generateSampleTrends() {
        const count = await this.prisma.trend.count();
        if (count > 0)
            return;
        const sampleGames = [
            'Anime Last Stand',
            'Grow A Garden',
            'Blade Ball',
            'Type Soul',
            "Sol's RNG"
        ];
        for (const gameName of sampleGames) {
            try {
                const scores = this.calculateScores({
                    gameName,
                    videoCount: 5,
                    recentVideos: 3,
                    bestPhraseScore: 0.8
                }, { score: 80, growth: 1.5 });
                await this.prisma.trend.create({
                    data: {
                        keyword: gameName,
                        prediction_score: scores.predictionScore,
                        growth_rate: scores.growthRate,
                        acceleration: scores.acceleration,
                        platform_score: scores.platformScore,
                        ai_score: scores.aiScore,
                        platforms: 'youtube,google_trends',
                        first_seen_at: new Date()
                    }
                });
            }
            catch (error) {
                this.logger.error(`生成示例趋势 ${gameName} 失败:`, error);
            }
        }
    }
    extractGameCandidates(videos) {
        const gameNameMap = new Map();
        for (const video of videos) {
            const title = String((video === null || video === void 0 ? void 0 : video.title) || '').toLowerCase().trim();
            if (!title)
                continue;
            const phrases = this.extractPhrases(title);
            for (const phrase of phrases) {
                if (!this.isValidGameName(phrase))
                    continue;
                const normalizedPhrase = this.normalizeGameName(phrase);
                if (normalizedPhrase.length < 5)
                    continue;
                const phraseScore = this.scorePhrase(phrase, video);
                const current = gameNameMap.get(normalizedPhrase) || {
                    count: 0,
                    recentCount: 0,
                    bestPhraseScore: 0
                };
                gameNameMap.set(normalizedPhrase, {
                    count: current.count + 1,
                    recentCount: current.recentCount + (this.isRecentVideo(video.publishedAt) ? 1 : 0),
                    bestPhraseScore: Math.max(current.bestPhraseScore, phraseScore)
                });
            }
        }
        return Array.from(gameNameMap.entries())
            .filter(([_, data]) => data.count >= 2)
            .map(([gameName, data]) => ({
            gameName,
            videoCount: data.count,
            recentVideos: data.recentCount,
            bestPhraseScore: data.bestPhraseScore
        }))
            .sort((a, b) => {
            if (b.recentVideos !== a.recentVideos)
                return b.recentVideos - a.recentVideos;
            if (b.videoCount !== a.videoCount)
                return b.videoCount - a.videoCount;
            return b.bestPhraseScore - a.bestPhraseScore;
        })
            .slice(0, 100);
    }
    extractPhrases(text) {
        const words = text
            .replace(/[^a-zA-Z0-9\s']/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .split(' ')
            .filter(Boolean);
        const phrases = [];
        for (let size = 2; size <= 4; size++) {
            for (let i = 0; i <= words.length - size; i++) {
                const chunk = words.slice(i, i + size);
                const cleanedChunk = this.trimEdgeNoiseWords(chunk);
                if (cleanedChunk.length >= 2 && cleanedChunk.length <= 4) {
                    phrases.push(cleanedChunk.join(' '));
                }
            }
        }
        return [...new Set(phrases)];
    }
    trimEdgeNoiseWords(words) {
        let start = 0;
        let end = words.length - 1;
        while (start <= end && this.edgeNoiseWords.has(words[start])) {
            start++;
        }
        while (end >= start && this.edgeNoiseWords.has(words[end])) {
            end--;
        }
        return words.slice(start, end + 1);
    }
    isValidGameName(phrase) {
        const words = phrase.split(' ').filter(Boolean);
        if (words.length < 2 || words.length > 4)
            return false;
        if (words.some(word => word.length < 3))
            return false;
        if (words.some(word => this.stopWords.has(word)))
            return false;
        if (words.some(word => /^\d+$/.test(word)))
            return false;
        if (words.some(word => /^\d{4}$/.test(word)))
            return false;
        const joined = words.join(' ');
        if (/\b\d+\b/.test(joined))
            return false;
        if (joined.includes('free item'))
            return false;
        if (joined.includes('official merch'))
            return false;
        if (joined.includes('limited sale'))
            return false;
        return true;
    }
    normalizeGameName(name) {
        return name
            .trim()
            .split(' ')
            .map(word => {
            if (word.length === 0)
                return word;
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
            .join(' ');
    }
    isRecentVideo(publishedAt) {
        const publishDate = new Date(publishedAt);
        const now = new Date();
        const diffDays = (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays <= 3;
    }
    scorePhrase(phrase, video) {
        const words = phrase.split(' ').filter(Boolean);
        let score = 0;
        if (words.length === 2)
            score += 0.18;
        if (words.length === 3)
            score += 0.28;
        if (words.length === 4)
            score += 0.2;
        const hintMatches = words.filter(word => this.gameHintWords.has(word)).length;
        score += hintMatches * 0.12;
        if (this.isRecentVideo(video.publishedAt)) {
            score += 0.2;
        }
        return Math.min(1, score);
    }
    calculateScores(candidate, trendData) {
        const videoCount = Number(candidate.videoCount || 0);
        const recentVideos = Number(candidate.recentVideos || 0);
        const trendScoreRaw = Number((trendData === null || trendData === void 0 ? void 0 : trendData.score) || 0);
        const growthRaw = Number((trendData === null || trendData === void 0 ? void 0 : trendData.growth) || 0);
        const wordCount = String(candidate.gameName || '').split(' ').filter(Boolean).length;
        const videoScore = Math.min(25, videoCount * 2.5);
        const recentScore = Math.min(25, recentVideos * 4);
        const normalizedTrendScore = Math.min(25, trendScoreRaw * 0.25);
        const normalizedGrowthScore = Math.min(15, growthRaw * 10);
        let qualityScore = 0;
        if (wordCount === 2)
            qualityScore = 6;
        if (wordCount === 3)
            qualityScore = 10;
        if (wordCount === 4)
            qualityScore = 7;
        const phraseQualityBonus = Math.min(10, candidate.bestPhraseScore * 10);
        const predictionScore = Math.min(100, videoScore +
            recentScore +
            normalizedTrendScore +
            normalizedGrowthScore +
            qualityScore +
            phraseQualityBonus);
        const acceleration = videoCount > 0 ? Math.min(1, recentVideos / videoCount) : 0;
        const platformScore = trendScoreRaw > 0 || growthRaw > 0 ? 85 : 70;
        const aiScore = Math.min(100, predictionScore * 0.9 + phraseQualityBonus * 0.4);
        return {
            predictionScore,
            growthRate: growthRaw,
            acceleration,
            platformScore,
            aiScore
        };
    }
};
exports.TrendService = TrendService;
exports.TrendService = TrendService = TrendService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        youtube_service_1.YoutubeService,
        google_trends_service_1.GoogleTrendsService])
], TrendService);
