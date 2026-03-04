"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameController = void 0;
const common_1 = require("@nestjs/common");
const game_service_1 = require("./game.service");
let GameController = class GameController {
    constructor(gameService) {
        this.gameService = gameService;
    }
    async getGames(candidate) {
        const games = await this.gameService.getGames(candidate === 'true');
        const normalizeStatus = (score) => {
            if (typeof score !== 'number')
                return 'pending';
            if (score >= 60)
                return 'worth_doing';
            if (score >= 30)
                return 'pending';
            return 'observe';
        };
        return games.map(g => {
            const trend = g.trendScore || 0;
            const yt = g.youtubeCount || 0;
            const newWord = g.newWordScore || 0;
            const total = trend + yt + newWord;
            return {
                id: g.id,
                name: g.name,
                url: g.url,
                createdAt: g.createdAt,
                trendScore: trend,
                youtubeCount: yt,
                newWordScore: newWord,
                isCandidate: !!g.isCandidate,
                totalScore: total,
                status: normalizeStatus(newWord)
            };
        });
    }
    async seedGames() {
        const sampleGames = [
            {
                name: 'Space Shooter',
                url: 'https://itch.io/games/space-shooter',
            },
            {
                name: 'Puzzle Master',
                url: 'https://www.crazygames.com/puzzle-master',
            },
            {
                name: 'Racing Cars',
                url: 'https://itch.io/games/racing-cars',
            },
            {
                name: 'Adventure Quest',
                url: 'https://www.crazygames.com/adventure-quest',
            },
            {
                name: 'Tower Defense',
                url: 'https://itch.io/games/tower-defense',
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
    __param(0, (0, common_1.Query)('candidate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
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
