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
var DailyJobService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyJobService = void 0;
const common_1 = require("@nestjs/common");
const token_service_1 = require("../services/token.service");
const trend_service_1 = require("../services/trend.service");
let DailyJobService = DailyJobService_1 = class DailyJobService {
    constructor(tokenService, trendService) {
        this.tokenService = tokenService;
        this.trendService = trendService;
        this.logger = new common_1.Logger(DailyJobService_1.name);
    }
    async runJob() {
        const startTime = new Date();
        this.logger.log('🚀 开始执行每日 Roblox 趋势任务');
        try {
            this.logger.log('📊 Step1: 分析 Roblox 新游戏词');
            await this.tokenService.analyzeTokens();
            this.logger.log('📈 Step2: 计算游戏趋势评分');
            await this.trendService.processTrends();
            const endTime = new Date();
            this.logger.log('✅ 每日任务完成');
            return {
                status: 'success',
                startedAt: startTime,
                finishedAt: endTime,
                durationSeconds: (endTime.getTime() - startTime.getTime()) / 1000
            };
        }
        catch (error) {
            this.logger.error('❌ 每日任务失败', error);
            return {
                status: 'error',
                error: error.message,
                time: new Date()
            };
        }
    }
};
exports.DailyJobService = DailyJobService;
exports.DailyJobService = DailyJobService = DailyJobService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [token_service_1.TokenService,
        trend_service_1.TrendService])
], DailyJobService);
