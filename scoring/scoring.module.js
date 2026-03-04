"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoringModule = void 0;
const common_1 = require("@nestjs/common");
const scoring_service_1 = require("./scoring.service");
const scoring_controller_1 = require("./scoring.controller");
const game_module_1 = require("../game/game.module");
const trends_module_1 = require("../trends/trends.module");
const youtube_module_1 = require("../youtube/youtube.module");
let ScoringModule = class ScoringModule {
};
exports.ScoringModule = ScoringModule;
exports.ScoringModule = ScoringModule = __decorate([
    (0, common_1.Module)({
        imports: [game_module_1.GameModule, trends_module_1.TrendsModule, youtube_module_1.YoutubeModule],
        providers: [scoring_service_1.ScoringService],
        controllers: [scoring_controller_1.ScoringController],
        exports: [scoring_service_1.ScoringService],
    })
], ScoringModule);
