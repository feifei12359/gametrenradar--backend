"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrendsController = void 0;
const common_1 = require("@nestjs/common");
const trends_service_1 = require("./trends.service");
const game_service_1 = require("../game/game.service");
let TrendsController = class TrendsController {
    constructor(trendsService, gameService) {
        this.trendsService = trendsService;
        this.gameService = gameService;
    }
    async detectTrends() {
        const games = await this.gameService.getGames();
        for (const game of games) {
            try {
                const trendScore = await this.trendsService.getTrendScore(game.name);
                await this.gameService.updateGame(game.id, { trendScore });
            }
            catch (error) {
                console.error(`Error detecting trend for game ${game.name}:`, error);
            }
        }
        return { message: 'Trends detected successfully' };
    }
};
exports.TrendsController = TrendsController;
__decorate([
    (0, common_1.Post)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TrendsController.prototype, "detectTrends", null);
exports.TrendsController = TrendsController = __decorate([
    (0, common_1.Controller)("detect-trends"),
    __metadata("design:paramtypes", [trends_service_1.TrendsService, game_service_1.GameService])
], TrendsController);
