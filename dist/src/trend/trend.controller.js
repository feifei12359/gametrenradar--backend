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
exports.TrendController = void 0;
const common_1 = require("@nestjs/common");
let TrendController = class TrendController {
    async getExplodingTrends() {
        return [
            {
                word: 'Space Shooter',
                prediction_score: 85,
                growth_rate: 0.8,
                acceleration: 0.5,
                platform_score: 70,
                ai_score: 90,
                first_seen_at: new Date(),
                platforms: ['Steam', 'Roblox']
            },
            {
                word: 'Puzzle Master',
                prediction_score: 78,
                growth_rate: 0.6,
                acceleration: 0.3,
                platform_score: 60,
                ai_score: 80,
                first_seen_at: new Date(),
                platforms: ['Steam']
            }
        ];
    }
    async getEarlyTrends() {
        return [];
    }
    async getAllTrends() {
        return [
            {
                word: 'Space Shooter',
                prediction_score: 85,
                growth_rate: 0.8,
                acceleration: 0.5,
                platform_score: 70,
                ai_score: 90,
                first_seen_at: new Date(),
                platforms: ['Steam', 'Roblox']
            },
            {
                word: 'Puzzle Master',
                prediction_score: 78,
                growth_rate: 0.6,
                acceleration: 0.3,
                platform_score: 60,
                ai_score: 80,
                first_seen_at: new Date(),
                platforms: ['Steam']
            }
        ];
    }
    async getNewWords() {
        return { items: [] };
    }
    async runDailyJob() {
        return { ok: true, message: '完整检测已运行', timestamp: new Date() };
    }
    async health() {
        return { ok: true, time: new Date() };
    }
};
exports.TrendController = TrendController;
__decorate([
    (0, common_1.Get)('trend/exploding'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TrendController.prototype, "getExplodingTrends", null);
__decorate([
    (0, common_1.Get)('trend/early'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TrendController.prototype, "getEarlyTrends", null);
__decorate([
    (0, common_1.Get)('trend/all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TrendController.prototype, "getAllTrends", null);
__decorate([
    (0, common_1.Get)('new-words'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TrendController.prototype, "getNewWords", null);
__decorate([
    (0, common_1.Post)('daily-job'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TrendController.prototype, "runDailyJob", null);
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TrendController.prototype, "health", null);
exports.TrendController = TrendController = __decorate([
    (0, common_1.Controller)('api')
], TrendController);
