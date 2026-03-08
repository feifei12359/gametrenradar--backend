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
    getExplodingTrends() {
        return [
            { keyword: 'Space Shooter', score: 95 },
            { keyword: 'Puzzle Master', score: 88 },
        ];
    }
    getEarlyTrends() {
        return [
            { word: 'Puzzle Quest', prediction_score: 70, growth_rate: 5, acceleration: 0.5, platform_score: 60, ai_score: 65, first_seen_at: new Date(), platforms: ['Steam'] }
        ];
    }
    getAllTrends() {
        return [
            { word: 'AI Game', prediction_score: 95, growth_rate: 12, acceleration: 2, platform_score: 80, ai_score: 90, first_seen_at: new Date(), platforms: ['Steam'] },
            { word: 'Space Sandbox', prediction_score: 88, growth_rate: 10, acceleration: 1.5, platform_score: 70, ai_score: 85, first_seen_at: new Date(), platforms: ['Roblox'] },
            { word: 'Puzzle Quest', prediction_score: 70, growth_rate: 5, acceleration: 0.5, platform_score: 60, ai_score: 65, first_seen_at: new Date(), platforms: ['Steam'] }
        ];
    }
    runDailyJob() {
        return { ok: true, message: '模拟完整检测已运行', timestamp: new Date() };
    }
};
exports.TrendController = TrendController;
__decorate([
    (0, common_1.Get)('exploding'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TrendController.prototype, "getExplodingTrends", null);
__decorate([
    (0, common_1.Get)('early'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TrendController.prototype, "getEarlyTrends", null);
__decorate([
    (0, common_1.Get)('all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TrendController.prototype, "getAllTrends", null);
__decorate([
    (0, common_1.Post)('daily-job'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TrendController.prototype, "runDailyJob", null);
exports.TrendController = TrendController = __decorate([
    (0, common_1.Controller)('trend')
], TrendController);
