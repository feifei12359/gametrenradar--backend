"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScraperService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
const cheerio = require("cheerio");
const game_service_1 = require("../game/game.service");
const trends_service_1 = require("../trends/trends.service");
const youtube_service_1 = require("../youtube/youtube.service");
let ScraperService = class ScraperService {
    constructor(gameService, trendsService, youtubeService) {
        this.gameService = gameService;
        this.trendsService = trendsService;
        this.youtubeService = youtubeService;
        this.genericKeywords = [
            "shooter",
            "puzzle",
            "racing",
            "defense",
            "adventure",
            "simulator",
            "clicker",
            "idle",
            "arcade",
            "strategy",
            "game"
        ];
        this.warnedItch = false;
        this.itchDisabledUntil = 0;
    }
    async scrapeItchIo() {
        try {
            if (this.itchDisabledUntil && Date.now() < this.itchDisabledUntil) {
                return [];
            }
            const primaryUrl = 'https://itch.io/games/newest/html5';
            const fallbackUrl = 'https://itch.io/games/newest';
            const sanitize = (u) => String(u || '').replace(/[`\s]+/g, '');
            const targetUrl = sanitize(primaryUrl);
            const response = await axios_1.default.get(targetUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': 'https://itch.io/',
                    'Sec-Fetch-Site': 'same-origin',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Dest': 'document',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept': 'text/html,application/xhtml+xml',
                    'Connection': 'keep-alive',
                    'Accept-Encoding': 'gzip, deflate'
                },
                timeout: 10000
            });
            if (response.status >= 400 || typeof response.data !== 'string') {
                const resp2 = await axios_1.default.get(sanitize(fallbackUrl), {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Referer': 'https://itch.io/',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Accept': 'text/html,application/xhtml+xml',
                        'Connection': 'keep-alive',
                        'Accept-Encoding': 'gzip, deflate'
                    },
                    timeout: 10000
                });
                return this.parseItch(resp2.data);
            }
            return this.parseItch(response.data);
        }
        catch (error) {
            if (!this.warnedItch) {
                this.warnedItch = true;
                console.warn('Itch.io scrape failed:', error && error.message ? error.message : String(error));
            }
            if (error && error.response && error.response.status === 403) {
                this.itchDisabledUntil = Date.now() + 6 * 60 * 60 * 1000;
            }
            return [];
        }
    }
    async scrapeCrazyGames() {
        try {
            const primaryUrl = 'https://www.crazygames.com/new-games';
            const fallbackUrl = 'https://www.crazygames.com/';
            const sanitize = (u) => String(u || '').replace(/[`\s]+/g, '');
            const targetUrl = sanitize(primaryUrl);
            const response = await axios_1.default.get(targetUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept': 'text/html,application/xhtml+xml',
                    'Connection': 'keep-alive',
                    'Accept-Encoding': 'gzip, deflate'
                },
                timeout: 10000
            });
            if (response.status >= 400) {
                const resp2 = await axios_1.default.get(sanitize(fallbackUrl), {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Accept': 'text/html,application/xhtml+xml',
                        'Connection': 'keep-alive',
                        'Accept-Encoding': 'gzip, deflate'
                    },
                    timeout: 10000
                });
                return this.parseCrazyGames(resp2.data);
            }
            return this.parseCrazyGames(response.data);
        }
        catch (error) {
            try {
                const resp2 = await axios_1.default.get('https://www.crazygames.com/', {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Accept': 'text/html,application/xhtml+xml',
                        'Connection': 'keep-alive',
                        'Accept-Encoding': 'gzip, deflate'
                    },
                    timeout: 10000
                });
                return this.parseCrazyGames(resp2.data);
            }
            catch (e) {
                console.error('CrazyGames scrape failed:', error && error.message ? error.message : String(error));
                return [];
            }
        }
    }
    parseCrazyGames(html) {
        try {
            const $ = cheerio.load(html || '');
            const games = [];
            $('.game-card').each((index, element) => {
                if (index >= 50)
                    return false;
                const gameName = $(element).find('.game-card__title').text().trim();
                const url = $(element).find('a').attr('href');
                if (gameName && url) {
                    games.push({
                        name: gameName,
                        url: `https://www.crazygames.com${url}`,
                    });
                }
            });
            return games;
        } catch (err) {
            return [];
        }
    }
    parseItch(html) {
        try {
            const text = String(html || '');
            if (/Just a moment/i.test(text) || /cf-mitigated/i.test(text)) {
                return [];
            }
            const $ = cheerio.load(text);
            const games = [];
            $('.game_cell').each((index, element) => {
                if (index >= 50)
                    return false;
                const gameName = $(element).find('.game_title').text().trim();
                const url = $(element).find('.game_link').attr('href');
                if (gameName && url) {
                    games.push({ name: gameName, url });
                }
            });
            return games;
        } catch (err) {
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
    async filterAndSaveGames() {
        const games = await this.scrapeGames();
        const filteredGames = [];
        for (const game of games) {
            if (await this.passAllFilters(game)) {
                filteredGames.push(game);
            }
        }
        for (const game of filteredGames) {
            try {
                await this.gameService.createGame(game);
            }
            catch (error) {
                if (!error.message.includes('Unique constraint')) {
                    throw error;
                }
            }
        }
        return filteredGames;
    }
    async passAllFilters(game) {
        if (!this.passTimeFilter(game.publishDate || new Date())) {
            return false;
        }
        if (!this.passTitleStructureFilter(game.name)) {
            return false;
        }
        if (!this.passGenericKeywordFilter(game.name)) {
            return false;
        }
        const trendData = await this.trendsService.getTrendScore(game.name);
        if (!this.passHistoricalTrendFilter(trendData)) {
            return false;
        }
        const youtubeData = await this.youtubeService.getYoutubeScore(game.name);
        if (!this.passYouTubeEarlySignalFilter(youtubeData)) {
            return false;
        }
        return true;
    }
    passTimeFilter(publishDate) {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return publishDate >= thirtyDaysAgo;
    }
    passTitleStructureFilter(name) {
        const words = name.split(/\s+/).filter(word => word.length > 0);
        return words.length >= 1;
    }
    passGenericKeywordFilter(name) {
        const words = name.split(/\s+/).filter(word => word.length > 0).map(w => w.toLowerCase());
        const genericCount = words.filter(word => this.genericKeywords.includes(word)).length;
        const genericRatio = genericCount / words.length;
        return genericRatio < 0.5;
    }
    passHistoricalTrendFilter(trendData) {
        if (!trendData) {
            return true;
        }
        if (typeof trendData.growthRate === 'number' && trendData.growthRate >= 10) {
            return true;
        }
        if (typeof trendData.averageScore !== 'number') {
            return true;
        }
        return trendData.averageScore <= 40;
    }
    passYouTubeEarlySignalFilter(youtubeData) {
        if (!youtubeData) {
            return true;
        }
        if (youtubeData.apiAvailable === false) {
            return true;
        }
        const count = youtubeData.videoCount || 0;
        return count >= 3 && count <= 150;
    }
};
exports.ScraperService = ScraperService;
exports.ScraperService = ScraperService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [game_service_1.GameService,
    trends_service_1.TrendsService,
    youtube_service_1.YoutubeService])
], ScraperService);
