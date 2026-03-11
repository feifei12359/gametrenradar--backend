"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AIScoreService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIScoreService = void 0;
const common_1 = require("@nestjs/common");
let AIScoreService = AIScoreService_1 = class AIScoreService {
    constructor() {
        this.logger = new common_1.Logger(AIScoreService_1.name);
        this.gameKeywords = new Set([
            'anime', 'tower', 'defense', 'simulator', 'tycoon', 'obby', 'battle', 'battlegrounds',
            'rpg', 'survival', 'shooter', 'horror', 'idle', 'clicker', 'farm', 'driving', 'racing',
            'strategy', 'co-op', 'pvp', 'soul', 'garden', 'blade', 'ball', 'last', 'stand', 'rng',
            'grow', 'type', 'anime', 'defense', 'tower', 'simulator', 'tycoon'
        ]);
        this.gameTypeKeywords = new Set([
            'simulator', 'tycoon', 'obby', 'rpg', 'survival', 'shooter', 'horror', 'idle', 'clicker',
            'farm', 'driving', 'racing', 'strategy', 'defense', 'battle', 'battlegrounds'
        ]);
        this.gameThemeKeywords = new Set([
            'anime', 'soul', 'garden', 'blade', 'ball', 'tower', 'last', 'stand', 'rng', 'grow', 'type'
        ]);
    }
    async calculateAIScore(keyword, videoCount, recentCount) {
        this.logger.log(`计算 ${keyword} 的 AI 分数`);
        let score = 0;
        score += Math.min(30, videoCount * 2);
        score += Math.min(20, recentCount * 3);
        score += this.calculateGameDomainScore(keyword);
        score += this.calculateWordCountScore(keyword);
        score += this.calculateGameNamePatternScore(keyword);
        return Math.min(100, Math.max(0, score));
    }
    async calculatePlatformScore(keyword, platforms) {
        this.logger.log(`计算 ${keyword} 的平台分数`);
        let score = 0;
        score += Math.min(20, platforms.length * 5);
        const platformQuality = this.calculatePlatformQuality(platforms);
        score += platformQuality;
        return Math.min(100, Math.max(0, score));
    }
    calculateGameDomainScore(keyword) {
        const lowerKeyword = keyword.toLowerCase();
        let score = 0;
        const hasGameKeyword = Array.from(this.gameKeywords).some(key => lowerKeyword.includes(key));
        if (hasGameKeyword) {
            score += 15;
        }
        const hasGameTypeKeyword = Array.from(this.gameTypeKeywords).some(key => lowerKeyword.includes(key));
        if (hasGameTypeKeyword) {
            score += 10;
        }
        const hasGameThemeKeyword = Array.from(this.gameThemeKeywords).some(key => lowerKeyword.includes(key));
        if (hasGameThemeKeyword) {
            score += 10;
        }
        return score;
    }
    calculateWordCountScore(keyword) {
        const wordCount = keyword.split(' ').length;
        if (wordCount >= 2 && wordCount <= 4) {
            return 15;
        }
        else if (wordCount === 1) {
            return 0;
        }
        else {
            return 5;
        }
    }
    calculateGameNamePatternScore(keyword) {
        const lowerKeyword = keyword.toLowerCase();
        let score = 0;
        const patterns = [
            /\s+(last|stand|soul|garden|blade|ball|rng|grow|type|defense|tower|simulator|tycoon)\s*$/i,
            /^(anime|tower|blade|grow|type|soul|sol)\s+/i,
            /\s+(defense|simulator|tycoon|battlegrounds|rpg|survival|shooter|horror|idle|clicker)\s*$/i
        ];
        const hasPattern = patterns.some(pattern => pattern.test(keyword));
        if (hasPattern) {
            score += 10;
        }
        return score;
    }
    calculatePlatformQuality(platforms) {
        let score = 0;
        if (platforms.includes('youtube')) {
            score += 40;
        }
        if (platforms.includes('google_trends')) {
            score += 35;
        }
        const otherPlatforms = platforms.filter(p => p !== 'youtube' && p !== 'google_trends');
        score += Math.min(25, otherPlatforms.length * 10);
        return score;
    }
};
exports.AIScoreService = AIScoreService;
exports.AIScoreService = AIScoreService = AIScoreService_1 = __decorate([
    (0, common_1.Injectable)()
], AIScoreService);
