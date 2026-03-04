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
var ScraperService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScraperService = void 0;
const common_1 = require("@nestjs/common");
const game_service_1 = require("../game/game.service");
let ScraperService = ScraperService_1 = class ScraperService {
    constructor(gameService) {
        this.gameService = gameService;
        this.logger = new common_1.Logger(ScraperService_1.name);
    }
    async scrapeAndSaveGames() {
        const scrapedGames = await this.fakeScrape();
        for (const game of scrapedGames) {
            await this.gameService.createGame({ name: game.name });
        }
        this.logger.log(`Saved ${scrapedGames.length} games to database`);
    }
    async fakeScrape() {
        return [
            { name: 'Space Shooter' },
            { name: 'Puzzle Master' },
            { name: 'Racing Cars' },
            { name: 'Adventure Quest' },
            { name: 'Tower Defense' },
        ];
    }
};
exports.ScraperService = ScraperService;
exports.ScraperService = ScraperService = ScraperService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [game_service_1.GameService])
], ScraperService);
