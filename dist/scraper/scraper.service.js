"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScraperService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
const cheerio = require("cheerio");
let ScraperService = class ScraperService {
    async scrapeItchIo() {
        try {
            const response = await axios_1.default.get('https://itch.io/games/newest/html5');
            const $ = cheerio.load(response.data);
            const games = [];
            $('.game_cell').each((index, element) => {
                if (index >= 50)
                    return false;
                const gameName = $(element).find('.game_title').text().trim();
                const url = $(element).find('.game_link').attr('href');
                const publishDate = new Date();
                if (gameName && url) {
                    games.push({
                        gameName,
                        source: 'itch.io',
                        url,
                        publishDate,
                    });
                }
            });
            return games;
        }
        catch (error) {
            console.error('Error scraping itch.io:', error);
            return [];
        }
    }
    async scrapeCrazyGames() {
        try {
            const response = await axios_1.default.get('https://www.crazygames.com/new-games');
            const $ = cheerio.load(response.data);
            const games = [];
            $('.game-card').each((index, element) => {
                if (index >= 50)
                    return false;
                const gameName = $(element).find('.game-card__title').text().trim();
                const url = $(element).find('a').attr('href');
                const publishDate = new Date();
                if (gameName && url) {
                    games.push({
                        gameName,
                        source: 'CrazyGames',
                        url: `https://www.crazygames.com${url}`,
                        publishDate,
                    });
                }
            });
            return games;
        }
        catch (error) {
            console.error('Error scraping CrazyGames:', error);
            return [];
        }
    }
    async scrapeGames() {
        const itchIoGames = await this.scrapeItchIo();
        const crazyGames = await this.scrapeCrazyGames();
        const uniqueGames = [];
        const urls = new Set();
        [...itchIoGames, ...crazyGames].forEach(game => {
            if (!urls.has(game.url)) {
                urls.add(game.url);
                uniqueGames.push(game);
            }
        });
        return uniqueGames;
    }
};
exports.ScraperService = ScraperService;
exports.ScraperService = ScraperService = __decorate([
    (0, common_1.Injectable)()
], ScraperService);
//# sourceMappingURL=scraper.service.js.map