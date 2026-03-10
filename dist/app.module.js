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
const prisma_module_1 = require("./prisma/prisma.module");
const trend_controller_1 = require("./controllers/trend.controller");
const crawler_service_1 = require("./services/crawler.service");
const token_service_1 = require("./services/token.service");
const ai_score_service_1 = require("./services/ai-score.service");
const trend_service_1 = require("./services/trend.service");
const daily_job_service_1 = require("./jobs/daily-job.service");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [trend_controller_1.TrendController],
        providers: [
            crawler_service_1.CrawlerService,
            token_service_1.TokenService,
            ai_score_service_1.AIScoreService,
            trend_service_1.TrendService,
            daily_job_service_1.DailyJobService
        ],
    })
], AppModule);
