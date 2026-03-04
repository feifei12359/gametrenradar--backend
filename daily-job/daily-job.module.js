"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyJobModule = void 0;
const common_1 = require("@nestjs/common");
const scraper_module_1 = require("../scraper/scraper.module");
const game_module_1 = require("../game/game.module");
const trends_module_1 = require("../trends/trends.module");
const youtube_module_1 = require("../youtube/youtube.module");
const scoring_module_1 = require("../scoring/scoring.module");
const daily_job_service_1 = require("./daily-job.service");
const daily_job_controller_1 = require("./daily-job.controller");
let DailyJobModule = class DailyJobModule {
};
exports.DailyJobModule = DailyJobModule;
exports.DailyJobModule = DailyJobModule = __decorate([
    (0, common_1.Module)({
        imports: [
            scraper_module_1.ScraperModule,
            game_module_1.GameModule,
            trends_module_1.TrendsModule,
            youtube_module_1.YoutubeModule,
            scoring_module_1.ScoringModule,
        ],
        providers: [daily_job_service_1.DailyJobService],
        controllers: [daily_job_controller_1.DailyJobController],
    })
], DailyJobModule);
//# sourceMappingURL=daily-job.module.js.map