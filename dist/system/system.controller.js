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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemController = void 0;
const common_1 = require("@nestjs/common");
const token_service_1 = require("../services/token.service");
const trend_service_1 = require("../services/trend.service");
let SystemController = class SystemController {
    constructor(tokenService, trendService) {
        this.tokenService = tokenService;
        this.trendService = trendService;
    }
    async resetSystem() {
        const startedAt = new Date();
        try {
            await this.tokenService.clearDatabase();
            await this.tokenService.analyzeTokens();
            await this.trendService.processTrends();
            const finishedAt = new Date();
            const durationSeconds = Math.round((finishedAt.getTime() - startedAt.getTime()) / 1000);
            return {
                success: true,
                message: '系统已重置并重新生成趋势数据',
                startedAt: startedAt.toISOString(),
                finishedAt: finishedAt.toISOString(),
                durationSeconds
            };
        }
        catch (error) {
            const finishedAt = new Date();
            const durationSeconds = Math.round((finishedAt.getTime() - startedAt.getTime()) / 1000);
            return {
                success: false,
                message: '系统重置失败',
                error: error instanceof Error ? error.message : String(error),
                startedAt: startedAt.toISOString(),
                finishedAt: finishedAt.toISOString(),
                durationSeconds
            };
        }
    }
};
exports.SystemController = SystemController;
__decorate([
    (0, common_1.Post)('reset'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SystemController.prototype, "resetSystem", null);
exports.SystemController = SystemController = __decorate([
    (0, common_1.Controller)('system'),
    __metadata("design:paramtypes", [token_service_1.TokenService,
        trend_service_1.TrendService])
], SystemController);
