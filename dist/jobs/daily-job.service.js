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
const crawler_service_1 = require("../services/crawler.service");
const token_service_1 = require("../services/token.service");
const trend_service_1 = require("../services/trend.service");
const cron = require("node-cron");
let DailyJobService = DailyJobService_1 = class DailyJobService {
    constructor(crawlerService, tokenService, trendService) {
        this.crawlerService = crawlerService;
        this.tokenService = tokenService;
        this.trendService = trendService;
        this.logger = new common_1.Logger(DailyJobService_1.name);
        this.setupCronJob();
    }
    setupCronJob() {
        cron.schedule('0 2 * * *', async () => {
            this.logger.log('开始执行每日趋势检测任务');
            await this.runFullDetection();
            this.logger.log('每日趋势检测任务完成');
        });
    }
    async runFullDetection() {
        try {
            this.logger.log('1. 开始抓取平台数据');
            const keywords = await this.crawlerService.crawlAllPlatforms();
            this.logger.log('2. 开始分析关键词');
            await this.tokenService.analyzeTokens(keywords);
            this.logger.log('3. 开始处理趋势数据');
            await this.trendService.processTrends(keywords);
            this.logger.log('4. 检查并生成示例数据');
            await this.trendService.generateSampleTrends();
            this.logger.log('完整趋势检测任务完成');
            return { success: true, message: 'Trend detection completed' };
        }
        catch (error) {
            this.logger.error('完整趋势检测任务失败:', error);
            return { success: false, message: 'Trend detection failed' };
        }
    }
};
exports.DailyJobService = DailyJobService;
exports.DailyJobService = DailyJobService = DailyJobService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [crawler_service_1.CrawlerService,
        token_service_1.TokenService,
        trend_service_1.TrendService])
], DailyJobService);
