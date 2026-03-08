"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DailyJobService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyJobService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const scraper_service_1 = require("../scraper/scraper.service");
const game_service_1 = require("../game/game.service");
const trends_service_1 = require("../trends/trends.service");
const youtube_service_1 = require("../youtube/youtube.service");
const scoring_service_1 = require("../scoring/scoring.service");
let DailyJobService = DailyJobService_1 = class DailyJobService {
    constructor(scraperService, gameService, trendsService, youtubeService, scoringService) {
        this.scraperService = scraperService;
        this.gameService = gameService;
        this.trendsService = trendsService;
        this.youtubeService = youtubeService;
        this.scoringService = scoringService;
        this.logger = new common_1.Logger(DailyJobService_1.name);
    }
    async executeDailyJob() {
        this.logger.log('Starting daily job...');
        const scrapedGames = await this.scraperService.scrapeGames();
        this.logger.log(`Scraped ${scrapedGames.length} games`);
        let totalScraped = 0;
        for (const game of scrapedGames) {
            const existingGame = await this.gameService.findByUrl(game.url);
            if (!existingGame) {
                await this.gameService.createGame(game);
                totalScraped++;
            }
        }
        const recentGames = await this.gameService.getRecentGames(3);
        this.logger.log(`Found ${recentGames.length} recent games to score`);
        let scored = 0;
        let worthy = 0;
        for (const game of recentGames) {
            try {
                const newScore = this.scoringService.calculateNewScore(game.publishDate);
                const trendScore = await this.trendsService.getTrendScore(game.gameName);
                const ytScore = await this.youtubeService.getYoutubeScore(game.gameName);
                const totalScore = this.scoringService.calculateTotalScore(newScore, trendScore, ytScore);
                const status = this.scoringService.determineStatus(totalScore);
                await this.gameService.updateGame(game.id, {
                    newScore,
                    trendScore,
                    ytScore,
                    totalScore,
                    status,
                });
                scored++;
                if (status === 'worth_doing') {
                    worthy++;
                }
            }
            catch (error) {
                this.logger.error(`Error scoring game ${game.gameName}:`, error);
            }
        }
        this.logger.log(`Daily job completed: ${totalScraped} scraped, ${scored} scored, ${worthy} worthy`);
        return {
            totalScraped,
            scored,
            worthy,
        };
    }
    async handleCron() {
        this.logger.log('Running daily job via cron...');
        await this.executeDailyJob();
    }
};
exports.DailyJobService = DailyJobService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DailyJobService.prototype, "handleCron", null);
exports.DailyJobService = DailyJobService = DailyJobService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [scraper_service_1.ScraperService,
        game_service_1.GameService,
        trends_service_1.TrendsService,
        youtube_service_1.YoutubeService,
        scoring_service_1.ScoringService])
], DailyJobService);
//# sourceMappingURL=daily-job.service.js.map