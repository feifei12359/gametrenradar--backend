"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScraperModule = void 0;
const common_1 = require("@nestjs/common");
const scraper_service_1 = require("./scraper.service");
const scraper_controller_1 = require("./scraper.controller");
const game_module_1 = require("../game/game.module");
const trends_module_1 = require("../trends/trends.module");
const youtube_module_1 = require("../youtube/youtube.module");
let ScraperModule = class ScraperModule {
};
exports.ScraperModule = ScraperModule;
exports.ScraperModule = ScraperModule = __decorate([
    (0, common_1.Module)({
        imports: [game_module_1.GameModule, trends_module_1.TrendsModule, youtube_module_1.YoutubeModule],
        providers: [scraper_service_1.ScraperService],
        controllers: [scraper_controller_1.ScraperController],
        exports: [scraper_service_1.ScraperService],
    })
], ScraperModule);
