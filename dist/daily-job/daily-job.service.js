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
const game_service_1 = require("../game/game.service");
let DailyJobService = DailyJobService_1 = class DailyJobService {
    constructor(gameService) {
        this.gameService = gameService;
        this.logger = new common_1.Logger(DailyJobService_1.name);
    }
    async runDailyJob() {
        const games = await this.gameService.getAllGames();
        for (const game of games) {
            if (game.name.toLowerCase().includes('test')) {
                await this.gameService.deleteGame(game.id);
                this.logger.log(`Deleted game: ${game.name}`);
            }
        }
        this.logger.log('Daily job finished');
    }
};
exports.DailyJobService = DailyJobService;
exports.DailyJobService = DailyJobService = DailyJobService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [game_service_1.GameService])
], DailyJobService);
