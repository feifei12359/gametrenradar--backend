"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoringService = void 0;
const common_1 = require("@nestjs/common");
let ScoringService = class ScoringService {
    calculateNewWordScore(game, trendData, youtubeData) {
        let trendScore = 0;
        let youtubeScore = 0;
        if (trendData) {
            trendScore = trendData.maxValue || 0;
        }
        if (youtubeData) {
            youtubeScore = youtubeData.videoCount || 0;
        }
        return Math.round((trendScore + youtubeScore) / 2);
    }
    determineCandidate(score) {
        return {
            isCandidate: score >= 30
        };
    }
};
exports.ScoringService = ScoringService;
exports.ScoringService = ScoringService = __decorate([
    (0, common_1.Injectable)()
], ScoringService);
