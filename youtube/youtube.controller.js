"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YoutubeController = void 0;
const common_1 = require("@nestjs/common");
const youtube_service_1 = require("./youtube.service");
const game_service_1 = require("../game/game.service");
let YoutubeController = class YoutubeController {
    constructor(youtubeService, gameService) {
        this.youtubeService = youtubeService;
        this.gameService = gameService;
    }
    async detectYouTube() {
        const games = await this.gameService.getGames();
        for (const game of games) {
            try {
                const youtubeCount = await this.youtubeService.getYouTubeScore(game.name);
                await this.gameService.updateGame(game.id, { youtubeCount });
            }
            catch (error) {
                console.error(`Error detecting YouTube score for game ${game.name}:`, error);
            }
        }
        return { message: 'YouTube detection completed successfully' };
    }
};
exports.YoutubeController = YoutubeController;
__decorate([
    (0, common_1.Post)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], YoutubeController.prototype, "detectYouTube", null);
exports.YoutubeController = YoutubeController = __decorate([
    (0, common_1.Controller)("detect-youtube"),
    __metadata("design:paramtypes", [youtube_service_1.YoutubeService, game_service_1.GameService])
], YoutubeController);
