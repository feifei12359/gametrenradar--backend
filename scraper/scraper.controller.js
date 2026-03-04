"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScraperController = void 0;
const common_1 = require("@nestjs/common");
const scraper_service_1 = require("./scraper.service");
let ScraperController = class ScraperController {
    constructor(scraperService) {
        this.scraperService = scraperService;
    }
    async grabGames() {
        const games = await this.scraperService.filterAndSaveGames();
        return { message: 'Games grabbed and filtered successfully', count: games.length };
    }
};
exports.ScraperController = ScraperController;
__decorate([
    (0, common_1.Post)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ScraperController.prototype, "grabGames", null);
exports.ScraperController = ScraperController = __decorate([
    (0, common_1.Controller)("grab-games"),
    __metadata("design:paramtypes", [scraper_service_1.ScraperService])
], ScraperController);
