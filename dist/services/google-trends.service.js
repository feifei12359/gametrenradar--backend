"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GoogleTrendsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleTrendsService = void 0;
const common_1 = require("@nestjs/common");
let GoogleTrendsService = GoogleTrendsService_1 = class GoogleTrendsService {
    constructor() {
        this.logger = new common_1.Logger(GoogleTrendsService_1.name);
        this.gameKeywords = new Set([
            'anime', 'tower', 'defense', 'simulator', 'tycoon', 'obby', 'battle', 'battlegrounds',
            'rpg', 'survival', 'shooter', 'horror', 'idle', 'clicker', 'farm', 'driving', 'racing',
            'strategy', 'co-op', 'pvp', 'soul', 'garden', 'blade', 'ball', 'last', 'stand', 'rng',
            'grow', 'type', 'anime', 'defense', 'tower', 'simulator', 'tycoon'
        ]);
    }
    async getTrendScore(keyword) {
        this.logger.log(`获取 ${keyword} 的趋势分数`);
        const baseScore = this.calculateStableScore(keyword);
        return baseScore;
    }
    async isTrending(keyword) {
        const score = await this.getTrendScore(keyword);
        return score > 50;
    }
    async getTrendData(keyword) {
        const score = await this.getTrendScore(keyword);
        const growth = this.calculateStableGrowth(keyword);
        return {
            score,
            growth,
            isTrending: score > 50,
            hasBreakout: score > 70
        };
    }
    calculateStableScore(keyword) {
        const lowerKeyword = keyword.toLowerCase();
        let score = 30;
        const hasGameKeyword = Array.from(this.gameKeywords).some(key => lowerKeyword.includes(key));
        if (hasGameKeyword) {
            score += 25;
        }
        const wordCount = lowerKeyword.split(' ').length;
        if (wordCount >= 2 && wordCount <= 4) {
            score += 20;
        }
        if (this.isGameNamePattern(lowerKeyword)) {
            score += 15;
        }
        return Math.min(100, Math.max(0, score));
    }
    calculateStableGrowth(keyword) {
        const lowerKeyword = keyword.toLowerCase();
        let growth = 0.5;
        const hasGameKeyword = Array.from(this.gameKeywords).some(key => lowerKeyword.includes(key));
        if (hasGameKeyword) {
            growth += 0.8;
        }
        const wordCount = lowerKeyword.split(' ').length;
        if (wordCount >= 2 && wordCount <= 4) {
            growth += 0.5;
        }
        if (this.isGameNamePattern(lowerKeyword)) {
            growth += 0.3;
        }
        return Math.min(2.0, Math.max(0, growth));
    }
    isGameNamePattern(keyword) {
        const patterns = [
            /\s+(last|stand|soul|garden|blade|ball|rng|grow|type|defense|tower|simulator|tycoon)\s*$/i,
            /^(anime|tower|blade|grow|type|soul|sol)\s+/i,
            /\s+(defense|simulator|tycoon|battlegrounds|rpg|survival|shooter|horror|idle|clicker)\s*$/i
        ];
        return patterns.some(pattern => pattern.test(keyword));
    }
};
exports.GoogleTrendsService = GoogleTrendsService;
exports.GoogleTrendsService = GoogleTrendsService = GoogleTrendsService_1 = __decorate([
    (0, common_1.Injectable)()
], GoogleTrendsService);
