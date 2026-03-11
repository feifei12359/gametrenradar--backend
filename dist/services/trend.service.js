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
const google_trends_service_1 = require("./google-trends.service");
const ai_score_service_1 = require("./ai-score.service");
let TrendService = TrendService_1 = class TrendService {
    constructor(prisma, youtubeService, googleTrendsService, aiScoreService) {
        this.prisma = prisma;
        this.youtubeService = youtubeService;
        this.googleTrendsService = googleTrendsService;
        this.aiScoreService = aiScoreService;
        this.logger = new common_1.Logger(TrendService_1.name);
    }
    async processTrends() {
        this.logger.log('开始处理趋势数据');
        const videos = await this.youtubeService.getRobloxVideos(7);
        const gameCandidates = this.extractGameCandidates(videos);
        for (const candidate of gameCandidates) {
            try {
                const trendData = await this.googleTrendsService.getTrendData(candidate.gameName);
                const aiScore = await this.aiScoreService.calculateAIScore(candidate.gameName, candidate.videoCount, candidate.recentCount);
                const platforms = ['youtube', 'google_trends'];
                const platformScore = await this.aiScoreService.calculatePlatformScore(candidate.gameName, platforms);
                const scores = this.calculateScores(candidate, trendData, aiScore, platformScore);
                await this.prisma.trend.upsert({
                    where: { keyword: candidate.gameName },
                    update: {
                        prediction_score: scores.predictionScore,
                        growth_rate: scores.growthRate,
                        acceleration: scores.acceleration,
                        platform_score: scores.platformScore,
                        ai_score: scores.aiScore,
                        platforms: platforms.join(','),
                        first_seen_at: candidate.firstSeenAt
                    },
                    create: {
                        keyword: candidate.gameName,
                        prediction_score: scores.predictionScore,
                        growth_rate: scores.growthRate,
                        acceleration: scores.acceleration,
                        platform_score: scores.platformScore,
                        ai_score: scores.aiScore,
                        platforms: platforms.join(','),
                        first_seen_at: candidate.firstSeenAt
                    }
                });
                this.logger.log(`处理趋势 ${candidate.gameName} 完成`);
            }
            catch (error) {
                this.logger.error(`处理趋势 ${candidate.gameName} 失败:`, error);
            }
        }
    }
    async getExplodingTrends() {
        const trends = await this.prisma.trend.findMany({
            orderBy: { prediction_score: 'desc' },
            take: 20
        });
        return trends.map(trend => ({
            keyword: trend.keyword,
            prediction_score: trend.prediction_score,
            growth_rate: trend.growth_rate,
            acceleration: trend.acceleration,
            platform_score: trend.platform_score,
            ai_score: trend.ai_score,
            platforms: trend.platforms,
            first_seen_at: trend.first_seen_at.toISOString()
        }));
    }
    async getEarlyTrends() {
        const trends = await this.prisma.trend.findMany({
            orderBy: { first_seen_at: 'desc' },
            take: 20
        });
        return trends.map(trend => ({
            keyword: trend.keyword,
            prediction_score: trend.prediction_score,
            growth_rate: trend.growth_rate,
            acceleration: trend.acceleration,
            platform_score: trend.platform_score,
            ai_score: trend.ai_score,
            platforms: trend.platforms,
            first_seen_at: trend.first_seen_at.toISOString()
        }));
    }
    async getAllTrends() {
        const trends = await this.prisma.trend.findMany({
            orderBy: { prediction_score: 'desc' },
            take: 50
        });
        return trends.map(trend => ({
            keyword: trend.keyword,
            prediction_score: trend.prediction_score,
            growth_rate: trend.growth_rate,
            acceleration: trend.acceleration,
            platform_score: trend.platform_score,
            ai_score: trend.ai_score,
            platforms: trend.platforms,
            first_seen_at: trend.first_seen_at.toISOString()
        }));
    }
    extractGameCandidates(videos) {
        const gameNameMap = new Map();
        for (const video of videos) {
            const title = video.title.toLowerCase();
            const phrases = this.extractPhrases(title);
            for (const phrase of phrases) {
                const cleanedPhrase = this.cleanPhrase(phrase);
                if (!cleanedPhrase)
                    continue;
                const words = cleanedPhrase.split(' ');
                if (words.length < 2 || words.length > 4)
                    continue;
                if (!this.isValidGameName(cleanedPhrase))
                    continue;
                const gameName = this.normalizeGameName(cleanedPhrase);
                if (gameName.length > 4) {
                    const current = gameNameMap.get(gameName) || { count: 0, recentCount: 0, firstSeenAt: video.publishedAt };
                    gameNameMap.set(gameName, {
                        count: current.count + 1,
                        recentCount: current.recentCount + (this.isRecentVideo(video.publishedAt) ? 1 : 0),
                        firstSeenAt: current.firstSeenAt
                    });
                }
            }
        }
        return Array.from(gameNameMap.entries())
            .filter(([_, data]) => data.count >= 2)
            .map(([gameName, data]) => ({
            gameName,
            videoCount: data.count,
            recentCount: data.recentCount,
            firstSeenAt: data.firstSeenAt
        }));
    }
    extractPhrases(text) {
        const words = text
            .replace(/[^a-zA-Z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 0);
        const phrases = [];
        for (let i = 0; i < words.length - 1; i++) {
            phrases.push(`${words[i]} ${words[i + 1]}`);
        }
        for (let i = 0; i < words.length - 2; i++) {
            phrases.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
        }
        for (let i = 0; i < words.length - 3; i++) {
            phrases.push(`${words[i]} ${words[i + 1]} ${words[i + 2]} ${words[i + 3]}`);
        }
        return phrases;
    }
    cleanPhrase(phrase) {
        const stopWords = new Set([
            'game', 'games', 'black', 'white', 'red', 'blue', 'green',
            'item', 'items', 'merch', 'shirt', 'shirts', 'pants',
            'free', 'sale', 'offsale', 'limited', 'pre', 'new', 'old',
            'update', 'official', 'roblox', 'version',
            '2024', '2025', '2026',
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must',
            'my', 'your', 'his', 'her', 'its', 'our', 'their',
            'this', 'that', 'these', 'those',
            'i', 'you', 'he', 'she', 'it', 'we', 'they',
            'what', 'which', 'who', 'when', 'where', 'why', 'how',
            'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
            'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
            'can', 'will', 'just', 'should', 'now',
            'holiday', 'card', 'golf', 'demo', 'disc', 'duck', 'children', 'panic', 'curse', 'amitabha', 'buddha'
        ]);
        let words = phrase.split(' ');
        while (words.length > 0 && stopWords.has(words[0])) {
            words.shift();
        }
        while (words.length > 0 && stopWords.has(words[words.length - 1])) {
            words.pop();
        }
        if (words.length < 2) {
            return null;
        }
        return words.join(' ');
    }
    isValidGameName(phrase) {
        const words = phrase.split(' ');
        if (words.length < 2 || words.length > 4) {
            return false;
        }
        if (words.some(word => word.length < 3)) {
            return false;
        }
        const junkWords = new Set([
            'video', 'videos', 'watch', 'subscribe', 'like', 'comment', 'share',
            'channel', 'youtube', 'tutorial', 'guide', 'how', 'play', 'playing',
            'episode', 'part', 'series', 'season', 'chapter',
            'duck', 'panic', 'children', 'amitabha', 'buddha', 'holiday', 'card', 'golf', 'demo', 'disc'
        ]);
        if (words.some(word => junkWords.has(word))) {
            return false;
        }
        const colorWords = new Set([
            'black', 'white', 'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'brown', 'gray', 'grey'
        ]);
        if (words.some(word => colorWords.has(word))) {
            return false;
        }
        const productWords = new Set([
            'merch', 'shirt', 'shirts', 'pants', 'hat', 'hats', 'jacket', 'jackets', 'shoe', 'shoes', 'hoodie', 'hoodies'
        ]);
        if (words.some(word => productWords.has(word))) {
            return false;
        }
        if (/\d/.test(phrase)) {
            return false;
        }
        const yearPattern = /^\d{4}$/;
        if (yearPattern.test(phrase)) {
            return false;
        }
        return true;
    }
    normalizeGameName(name) {
        return name
            .trim()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    isRecentVideo(publishedAt) {
        const now = new Date();
        const diffDays = (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays <= 3;
    }
    calculateScores(candidate, trendData, aiScore, platformScore) {
        const videoScore = Math.min(30, candidate.videoCount * 3);
        const recentScore = Math.min(20, candidate.recentCount * 5);
        const trendScore = Math.min(30, trendData.score * 0.3);
        const growthScore = Math.min(20, trendData.growth * 8);
        const predictionScore = Math.min(100, videoScore + recentScore + trendScore + growthScore);
        return {
            predictionScore,
            growthRate: trendData.growth,
            acceleration: trendData.growth * 0.5,
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
        google_trends_service_1.GoogleTrendsService,
        ai_score_service_1.AIScoreService])
], TrendService);
