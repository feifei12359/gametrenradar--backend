"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var CrawlerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrawlerService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
const cheerio = require("cheerio");
let CrawlerService = CrawlerService_1 = class CrawlerService {
    constructor() {
        this.logger = new common_1.Logger(CrawlerService_1.name);
    }
    async crawlSteam() {
        try {
            this.logger.log('开始抓取 Steam 新游戏');
            const url = 'https://store.steampowered.com/search/?sort_by=Released_DESC';
            const response = await axios_1.default.get(url);
            const $ = cheerio.load(response.data);
            const keywords = [];
            $('.search_result_row').each((index, element) => {
                const title = $(element).find('.title').text().trim();
                const tags = $(element).find('.top_tag').text().trim();
                const description = $(element).find('.search_reviewscore').text().trim();
                if (title) {
                    keywords.push(...this.extractKeywords(title));
                }
                if (tags) {
                    keywords.push(...this.extractKeywords(tags));
                }
                if (description) {
                    keywords.push(...this.extractKeywords(description));
                }
            });
            return [...new Set(keywords)].filter(keyword => keyword.length > 2);
        }
        catch (error) {
            this.logger.error('Steam 抓取失败:', error);
            return [];
        }
    }
    async crawlRoblox() {
        try {
            this.logger.log('开始抓取 Roblox 热门游戏');
            const url = 'https://www.roblox.com/discover';
            const response = await axios_1.default.get(url);
            const $ = cheerio.load(response.data);
            const keywords = [];
            $('.game-card').each((index, element) => {
                const title = $(element).find('.game-card-name').text().trim();
                if (title) {
                    keywords.push(...this.extractKeywords(title));
                }
            });
            return [...new Set(keywords)].filter(keyword => keyword.length > 2);
        }
        catch (error) {
            this.logger.error('Roblox 抓取失败:', error);
            return [];
        }
    }
    async crawlReddit() {
        try {
            this.logger.log('开始抓取 Reddit 游戏讨论');
            const subreddits = ['gamedev', 'indiegames', 'roblox'];
            const keywords = [];
            for (const subreddit of subreddits) {
                const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=50`;
                try {
                    const response = await axios_1.default.get(url, {
                        headers: {
                            'User-Agent': 'Game Trend Radar Bot'
                        }
                    });
                    if (response.data.data.children) {
                        response.data.data.children.forEach((post) => {
                            const title = post.data.title;
                            if (title) {
                                keywords.push(...this.extractKeywords(title));
                            }
                        });
                    }
                }
                catch (subError) {
                    this.logger.error(`Reddit ${subreddit} 抓取失败:`, subError);
                }
            }
            return [...new Set(keywords)].filter(keyword => keyword.length > 2);
        }
        catch (error) {
            this.logger.error('Reddit 抓取失败:', error);
            return [];
        }
    }
    extractKeywords(text) {
        return text
            .toLowerCase()
            .replace(/[^a-zA-Z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2)
            .filter(word => !this.isStopWord(word));
    }
    isStopWord(word) {
        const stopWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must'
        ]);
        return stopWords.has(word);
    }
    async crawlAllPlatforms() {
        const [steamKeywords, robloxKeywords, redditKeywords] = await Promise.all([
            this.crawlSteam(),
            this.crawlRoblox(),
            this.crawlReddit()
        ]);
        return [...new Set([...steamKeywords, ...robloxKeywords, ...redditKeywords])];
    }
};
exports.CrawlerService = CrawlerService;
exports.CrawlerService = CrawlerService = CrawlerService_1 = __decorate([
    (0, common_1.Injectable)()
], CrawlerService);
