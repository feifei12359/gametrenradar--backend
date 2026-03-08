"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrendsService = void 0;
const common_1 = require("@nestjs/common");
const googleTrends = require("google-trends-api");
let TrendsService = class TrendsService {
    async getTrendScore(gameName) {
        try {
            const result = await googleTrends.interestOverTime({
                keyword: gameName,
                geo: 'US',
                timeframe: 'now 30-d',
            });
            const data = JSON.parse(result);
            const timelineData = data.default.timelineData;
            if (!timelineData || timelineData.length === 0) {
                return 0;
            }
            const recentData = timelineData.slice(-7);
            const recentAvg = recentData.reduce((sum, item) => sum + item.value[0], 0) / recentData.length;
            const prevData = timelineData.slice(-14, -7);
            const prevAvg = prevData.reduce((sum, item) => sum + item.value[0], 0) / prevData.length;
            return recentAvg > prevAvg ? 1 : 0;
        }
        catch (error) {
            console.error('Error getting trend score:', error);
            return 0;
        }
    }
};
exports.TrendsService = TrendsService;
exports.TrendsService = TrendsService = __decorate([
    (0, common_1.Injectable)()
], TrendsService);
//# sourceMappingURL=trends.service.js.map