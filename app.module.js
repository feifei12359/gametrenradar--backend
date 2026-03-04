"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const prisma_module_1 = require("./prisma/prisma.module");
const game_module_1 = require("./game/game.module");
const scraper_module_1 = require("./scraper/scraper.module");
const trends_module_1 = require("./trends/trends.module");
const youtube_module_1 = require("./youtube/youtube.module");
const scoring_module_1 = require("./scoring/scoring.module");
const daily_job_module_1 = require("./daily-job/daily-job.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            schedule_1.ScheduleModule.forRoot(),
            prisma_module_1.PrismaModule,
            game_module_1.GameModule,
            scraper_module_1.ScraperModule,
            trends_module_1.TrendsModule,
            youtube_module_1.YoutubeModule,
            scoring_module_1.ScoringModule,
            daily_job_module_1.DailyJobModule,
        ],
        controllers: [],
        providers: [],
    })
], AppModule);