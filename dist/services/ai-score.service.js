"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIScoreService = void 0;
const common_1 = require("@nestjs/common");
let AIScoreService = class AIScoreService {
    constructor() {
        this.boostKeywords = [
            'simulator',
            'idle',
            'tycoon',
            'sandbox',
            'roguelike',
            'rpg',
            'shooter',
            'defense',
            'survival',
            'adventure'
        ];
    }
    calculateAIScore(keyword) {
        let score = 50;
        const lowerKeyword = keyword.toLowerCase();
        this.boostKeywords.forEach(boostWord => {
            if (lowerKeyword.includes(boostWord)) {
                score += 10;
            }
        });
        return Math.min(100, Math.max(0, score));
    }
    calculatePlatformScore(platforms) {
        return platforms.length * 20;
    }
    calculatePredictionScore(growthRate, acceleration, platformScore, aiScore) {
        const score = growthRate * 40 +
            acceleration * 20 +
            platformScore * 0.2 +
            aiScore * 0.2;
        return Math.min(100, Math.max(0, score));
    }
};
exports.AIScoreService = AIScoreService;
exports.AIScoreService = AIScoreService = __decorate([
    (0, common_1.Injectable)()
], AIScoreService);
