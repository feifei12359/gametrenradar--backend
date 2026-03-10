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
const ai_score_service_1 = require("./ai-score.service");
let TrendService = TrendService_1 = class TrendService {
    constructor(prisma, aiScoreService) {
        this.prisma = prisma;
        this.aiScoreService = aiScoreService;
        this.logger = new common_1.Logger(TrendService_1.name);
    }
    async processTrends(keywords) {
        this.logger.log('开始处理趋势数据');
        for (const keyword of keywords) {
            try {
                const growthRate = Math.random() * 2;
                const acceleration = Math.random() * 1;
                const platforms = ['steam', 'roblox', 'reddit'];
                const platformScore = this.aiScoreService.calculatePlatformScore(platforms);
                const aiScore = this.aiScoreService.calculateAIScore(keyword);
                const predictionScore = this.aiScoreService.calculatePredictionScore(growthRate, acceleration, platformScore, aiScore);
                const existingTrend = await this.prisma.trend.findUnique({
                    where: { keyword }
                });
                if (existingTrend) {
                    await this.prisma.trend.update({
                        where: { keyword },
                        data: {
                            prediction_score: predictionScore,
                            growth_rate: growthRate,
                            acceleration: acceleration,
                            platform_score: platformScore,
                            ai_score: aiScore
                        }
                    });
                }
                else {
                    await this.prisma.trend.create({
                        data: {
                            keyword,
                            prediction_score: predictionScore,
                            growth_rate: growthRate,
                            acceleration: acceleration,
                            platform_score: platformScore,
                            ai_score: aiScore,
                            platforms: platforms.join(','),
                            first_seen_at: new Date()
                        }
                    });
                }
            }
            catch (error) {
                this.logger.error(`处理趋势 ${keyword} 失败:`, error);
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
        if (count > 0) {
            return;
        }
        const sampleKeywords = [
            'Tower Defense',
            'Idle RPG',
            'Space Shooter',
            'Roblox Obby',
            'Roguelike Shooter'
        ];
        for (const keyword of sampleKeywords) {
            try {
                const growthRate = Math.random() * 2;
                const acceleration = Math.random() * 1;
                const platforms = ['steam', 'roblox'];
                const platformScore = this.aiScoreService.calculatePlatformScore(platforms);
                const aiScore = this.aiScoreService.calculateAIScore(keyword);
                const predictionScore = this.aiScoreService.calculatePredictionScore(growthRate, acceleration, platformScore, aiScore);
                await this.prisma.trend.create({
                    data: {
                        keyword,
                        prediction_score: predictionScore,
                        growth_rate: growthRate,
                        acceleration: acceleration,
                        platform_score: platformScore,
                        ai_score: aiScore,
                        platforms: platforms.join(','),
                        first_seen_at: new Date()
                    }
                });
            }
            catch (error) {
                this.logger.error(`生成示例趋势 ${keyword} 失败:`, error);
            }
        }
    }
};
exports.TrendService = TrendService;
exports.TrendService = TrendService = TrendService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ai_score_service_1.AIScoreService])
], TrendService);
