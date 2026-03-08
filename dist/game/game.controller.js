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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameController = void 0;
const common_1 = require("@nestjs/common");
const game_service_1 = require("./game.service");
let GameController = class GameController {
    constructor(gameService) {
        this.gameService = gameService;
    }
    async getGames(minScore) {
        return this.gameService.getGames(minScore ? parseInt(minScore.toString()) : undefined);
    }
    async seedGames() {
        const sampleGames = [
            {
                gameName: 'Space Shooter',
                source: 'itch.io',
                url: 'https://itch.io/games/space-shooter',
                publishDate: new Date(),
                tags: 'action,space',
                trendScore: 1,
                ytScore: 1,
                newScore: 1,
                totalScore: 3,
                status: 'worth_doing',
            },
            {
                gameName: 'Puzzle Master',
                source: 'CrazyGames',
                url: 'https://www.crazygames.com/puzzle-master',
                publishDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                tags: 'puzzle,brain',
                trendScore: 1,
                ytScore: 0,
                newScore: 1,
                totalScore: 2,
                status: 'worth_doing',
            },
            {
                gameName: 'Racing Cars',
                source: 'itch.io',
                url: 'https://itch.io/games/racing-cars',
                publishDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
                tags: 'racing,cars',
                trendScore: 0,
                ytScore: 0,
                newScore: 0,
                totalScore: 0,
                status: 'observe',
            },
            {
                gameName: 'Adventure Quest',
                source: 'CrazyGames',
                url: 'https://www.crazygames.com/adventure-quest',
                publishDate: new Date(),
                tags: 'adventure,rpg',
                trendScore: 1,
                ytScore: 1,
                newScore: 1,
                totalScore: 3,
                status: 'worth_doing',
            },
            {
                gameName: 'Tower Defense',
                source: 'itch.io',
                url: 'https://itch.io/games/tower-defense',
                publishDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                tags: 'strategy,defense',
                trendScore: 0,
                ytScore: 1,
                newScore: 1,
                totalScore: 2,
                status: 'worth_doing',
            },
        ];
        let count = 0;
        for (const gameData of sampleGames) {
            try {
                await this.gameService.createGame(gameData);
                count++;
            }
            catch (error) {
                if (!error.message.includes('Unique constraint')) {
                    throw error;
                }
            }
        }
        return { message: 'Sample games added successfully', count };
    }
};
exports.GameController = GameController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('minScore')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getGames", null);
__decorate([
    (0, common_1.Post)('seed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GameController.prototype, "seedGames", null);
exports.GameController = GameController = __decorate([
    (0, common_1.Controller)('games'),
    __metadata("design:paramtypes", [game_service_1.GameService])
], GameController);
//# sourceMappingURL=game.controller.js.map