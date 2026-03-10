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
const trend_service_1 = require("../services/trend.service");
const token_service_1 = require("../services/token.service");
const daily_job_service_1 = require("../jobs/daily-job.service");
let TrendController = class TrendController {
    constructor(trendService, tokenService, dailyJobService) {
        this.trendService = trendService;
        this.tokenService = tokenService;
        this.dailyJobService = dailyJobService;
    }
    async getExplodingTrends() {
        return this.trendService.getExplodingTrends();
    }
    async getEarlyTrends() {
        return this.trendService.getEarlyTrends();
    }
    async getAllTrends() {
        return this.trendService.getAllTrends();
    }
    async getNewWords() {
        return this.tokenService.getNewWords();
    }
    async runFullDetection() {
        return this.dailyJobService.runFullDetection();
    }
};
exports.TrendController = TrendController;
__decorate([
    (0, common_1.Get)('/trend/exploding'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TrendController.prototype, "getExplodingTrends", null);
__decorate([
    (0, common_1.Get)('/trend/early'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TrendController.prototype, "getEarlyTrends", null);
__decorate([
    (0, common_1.Get)('/trend/all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TrendController.prototype, "getAllTrends", null);
__decorate([
    (0, common_1.Get)('/new-words'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TrendController.prototype, "getNewWords", null);
__decorate([
    (0, common_1.Get)('/daily-job'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TrendController.prototype, "runFullDetection", null);
exports.TrendController = TrendController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [trend_service_1.TrendService,
        token_service_1.TokenService,
        daily_job_service_1.DailyJobService])
], TrendController);
