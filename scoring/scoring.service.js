"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoringService = void 0;
const common_1 = require("@nestjs/common");
let ScoringService = class ScoringService {
    calculateNewWordScore(game, trendData, youtubeData) {
        const daysSinceCreation = (Date.now() - game.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        const timeScore = Math.max(0, (30 - daysSinceCreation) * 2);
        const growthScore = trendData && trendData.growthRate ? trendData.growthRate * 3 : 0;
        const youtubeScore = youtubeData && youtubeData.videoCount ? youtubeData.videoCount * 1 : 0;
        const newWordScore = Math.round(timeScore + growthScore + youtubeScore);
        return newWordScore;
    }
    determineCandidate(newWordScore) {
        return {
            isCandidate: newWordScore > 60,
            score: newWordScore
        };
    }
};
exports.ScoringService = ScoringService;
exports.ScoringService = ScoringService = __decorate([
    (0, common_1.Injectable)()
], ScoringService);
