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
exports.GameController = void 0;
const common_1 = require("@nestjs/common");
const game_service_1 = require("./game.service");
let GameController = class GameController {
    constructor(gameService) {
        this.gameService = gameService;
    }
    async getGames() {
        return this.gameService.getGames();
    }
    async getExplodingTrends() {
        return this.gameService.getExplodingTrends();
    }
    async getEarlyTrends() {
        return [];
    }
    async getAllTrends() {
        return [];
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
exports.GameController = GameController;
__decorate([
    (0, common_1.Get)('games'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getGames", null);
__decorate([
    (0, common_1.Get)('trend/exploding'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getExplodingTrends", null);
__decorate([
    (0, common_1.Get)('trend/early'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getEarlyTrends", null);
__decorate([
    (0, common_1.Get)('trend/all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getAllTrends", null);
__decorate([
    (0, common_1.Get)('new-words'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getNewWords", null);
__decorate([
    (0, common_1.Post)('daily-job'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GameController.prototype, "runDailyJob", null);
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GameController.prototype, "health", null);
exports.GameController = GameController = __decorate([
    (0, common_1.Controller)('api'),
    __metadata("design:paramtypes", [game_service_1.GameService])
], GameController);
