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
var TokenService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const youtube_service_1 = require("../youtube/youtube.service");
let TokenService = TokenService_1 = class TokenService {
    constructor(prisma, youtubeService) {
        this.prisma = prisma;
        this.youtubeService = youtubeService;
        this.logger = new common_1.Logger(TokenService_1.name);
        this.stopWords = new Set([
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
        this.colorWords = new Set([
            'black', 'white', 'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'brown', 'gray', 'grey'
        ]);
        this.productWords = new Set([
            'merch', 'shirt', 'shirts', 'pants', 'hat', 'hats', 'jacket', 'jackets', 'shoe', 'shoes', 'hoodie', 'hoodies'
        ]);
        this.junkWords = new Set([
            'video', 'videos', 'watch', 'subscribe', 'like', 'comment', 'share',
            'channel', 'youtube', 'tutorial', 'guide', 'how', 'play', 'playing',
            'episode', 'part', 'series', 'season', 'chapter',
            'duck', 'panic', 'children', 'amitabha', 'buddha', 'holiday', 'card', 'golf', 'demo', 'disc'
        ]);
        this.yearPattern = /^\d{4}$/;
    }
    async analyzeTokens() {
        this.logger.log('开始分析 Roblox 新游戏词');
        const videos = await this.youtubeService.getRobloxVideos(7);
        const gameCandidates = this.extractGameCandidates(videos);
        for (const { gameName, score, videoCount, recentCount } of gameCandidates) {
            try {
                const existingWord = await this.prisma.newWord.findUnique({
                    where: { token: gameName }
                });
                if (existingWord) {
                    await this.prisma.newWord.update({
                        where: { token: gameName },
                        data: {
                            recent_count: existingWord.recent_count + recentCount,
                            total_count: existingWord.total_count + videoCount,
                            novelty_score: ((existingWord.recent_count + recentCount) / (existingWord.total_count + videoCount)) * score
                        }
                    });
                }
                else {
                    await this.prisma.newWord.create({
                        data: {
                            token: gameName,
                            novelty_score: 1.0 * score,
                            recent_count: recentCount,
                            total_count: videoCount,
                            first_seen_at: new Date()
                        }
                    });
                }
            }
            catch (error) {
                this.logger.error(`分析游戏名 ${gameName} 失败:`, error);
            }
        }
    }
    async getNewWords() {
        const allNewWords = await this.prisma.newWord.findMany({
            orderBy: { novelty_score: 'desc' },
            take: 200
        });
        const filteredWords = allNewWords.filter(word => {
            const token = word.token;
            const words = token.split(' ');
            if (words.length < 2 || words.length > 4) {
                return false;
            }
            if (words.some(w => this.junkWords.has(w.toLowerCase()))) {
                return false;
            }
            if (words.some(w => this.colorWords.has(w.toLowerCase()))) {
                return false;
            }
            if (words.some(w => this.productWords.has(w.toLowerCase()))) {
                return false;
            }
            if (/\d/.test(token)) {
                return false;
            }
            return true;
        }).slice(0, 100);
        return {
            items: filteredWords.map(word => ({
                token: word.token,
                noveltyScore: word.novelty_score,
                recentCount: word.recent_count,
                totalCount: word.total_count,
                firstSeenAt: word.first_seen_at.toISOString().split('T')[0]
            }))
        };
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
                    const current = gameNameMap.get(gameName) || { count: 0, recentCount: 0 };
                    gameNameMap.set(gameName, {
                        count: current.count + 1,
                        recentCount: current.recentCount + (this.isRecentVideo(video.publishedAt) ? 1 : 0)
                    });
                }
            }
        }
        return Array.from(gameNameMap.entries())
            .filter(([_, data]) => data.count >= 2)
            .map(([gameName, data]) => {
            const score = this.calculateGameNameScore(data.count, data.recentCount);
            return { gameName, score, videoCount: data.count, recentCount: data.recentCount };
        })
            .sort((a, b) => b.score - a.score)
            .slice(0, 50);
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
        let words = phrase.split(' ');
        while (words.length > 0 && this.stopWords.has(words[0])) {
            words.shift();
        }
        while (words.length > 0 && this.stopWords.has(words[words.length - 1])) {
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
        if (words.some(word => this.junkWords.has(word))) {
            return false;
        }
        if (words.some(word => this.colorWords.has(word))) {
            return false;
        }
        if (words.some(word => this.productWords.has(word))) {
            return false;
        }
        if (/\d/.test(phrase)) {
            return false;
        }
        if (this.yearPattern.test(phrase)) {
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
    calculateGameNameScore(count, recentCount) {
        let score = count * 2;
        score += recentCount * 3;
        if (count >= 2) {
            score += 5;
        }
        return score;
    }
    async clearDatabase() {
        this.logger.log('开始清空数据库...');
        try {
            await this.prisma.newWord.deleteMany({});
            this.logger.log('NewWord 表已清空');
            await this.prisma.trend.deleteMany({});
            this.logger.log('Trend 表已清空');
            this.logger.log('数据库清空完成');
        }
        catch (error) {
            this.logger.error('清空数据库失败:', error);
            throw error;
        }
    }
};
exports.TokenService = TokenService;
exports.TokenService = TokenService = TokenService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        youtube_service_1.YoutubeService])
], TokenService);
