"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyJobService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const scraper_service_1 = require("../scraper/scraper.service");
const scoring_service_1 = require("../scoring/scoring.service");
const game_service_1 = require("../game/game.service");
const trends_service_1 = require("../trends/trends.service");
const youtube_service_1 = require("../youtube/youtube.service");
let DailyJobService = class DailyJobService {
    constructor(scraperService, scoringService, gameService, trendsService, youtubeService) {
        this.scraperService = scraperService;
        this.scoringService = scoringService;
        this.gameService = gameService;
        this.trendsService = trendsService;
        this.youtubeService = youtubeService;
        this.logger = new common_1.Logger(DailyJobService.name);
    }
    async executeDailyJob() {
        this.logger.log('Starting daily job...');
        let scraped = 0;
        let processed = 0;
        let candidates = 0;
        let cleaned = 0;
        try {
            const filteredGames = await this.scraperService.filterAndSaveGames();
            scraped = filteredGames.length;
            this.logger.log(`Scraped and filtered ${scraped} games`);
            const games = await this.gameService.getGames();
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
                    this.logger.error(`Error processing game ${game.name}: ${error.message}`);
                }
            }
            cleaned = await this.cleanOldGames();
            this.logger.log(`Daily job completed: ${scraped} scraped, ${processed} processed, ${candidates} candidates, ${cleaned} cleaned`);
            return {
                scraped,
                processed,
                candidates,
                cleaned,
                message: `处理完成：${scraped}个抓取，${processed}个处理，${candidates}个候选，${cleaned}个清理`
            };
        }
        catch (error) {
            this.logger.error('Daily job failed:', error);
            throw error;
        }
    }
    async cleanOldGames() {
        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
        const result = await this.gameService.deleteGames({
            createdAt: {
                lt: sixtyDaysAgo
            }
        });
        return result.count;
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
exports.DailyJobService = DailyJobService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [scraper_service_1.ScraperService,
    scoring_service_1.ScoringService,
    game_service_1.GameService,
    trends_service_1.TrendsService,
    youtube_service_1.YoutubeService])
], DailyJobService);
