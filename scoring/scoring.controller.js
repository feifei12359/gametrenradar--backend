"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoringController = void 0;
const common_1 = require("@nestjs/common");
const scoring_service_1 = require("./scoring.service");
const game_service_1 = require("../game/game.service");
const trends_service_1 = require("../trends/trends.service");
const youtube_service_1 = require("../youtube/youtube.service");
let ScoringController = class ScoringController {
    constructor(scoringService, gameService, trendsService, youtubeService) {
        this.scoringService = scoringService;
        this.gameService = gameService;
        this.trendsService = trendsService;
        this.youtubeService = youtubeService;
    }
    async updateScores() {
        const games = await this.gameService.getGames();
        let processed = 0;
        let candidates = 0;
        for (const game of games) {
            try {
                const trendData = await this.trendsService.getTrendScore(game.name);
                const youtubeData = await this.youtubeService.getYoutubeScore(game.name);
                const newWordScore = this.scoringService.calculateNewWordScore(game, trendData, youtubeData);
                const candidateStatus = this.scoringService.determineCandidate(newWordScore);
                await this.gameService.updateGame(game.id, {
                    trendScore: trendData ? trendData.maxValue : 0,
                    youtubeCount: youtubeData ? youtubeData.videoCount : 0,
                    newWordScore,
                    isCandidate: candidateStatus.isCandidate
                });
                processed++;
                if (candidateStatus.isCandidate) {
                    candidates++;
                }
            }
            catch (error) {
                console.error(`Error updating score for game ${game.name}:`, error);
            }
        }
        return { message: 'Scores updated successfully', processed, candidates };
    }
};
exports.ScoringController = ScoringController;
__decorate([
    (0, common_1.Post)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ScoringController.prototype, "updateScores", null);
exports.ScoringController = ScoringController = __decorate([
    (0, common_1.Controller)("update-scores"),
    __metadata("design:paramtypes", [scoring_service_1.ScoringService,
        game_service_1.GameService,
        trends_service_1.TrendsService,
        youtube_service_1.YoutubeService])
], ScoringController);
