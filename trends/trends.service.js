"use strict";
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
                timeframe: 'today 5-y',
            });
            const data = JSON.parse(result);
            const timelineData = data.default.timelineData;
            if (!timelineData || timelineData.length === 0) {
                return { maxValue: 0, averageScore: 0, growthRate: 0 };
            }
            const values = timelineData.map(item => item.value[0]);
            const maxValue = Math.max(...values);
            const averageScore = values.reduce((sum, val) => sum + val, 0) / values.length;
            const recent30Days = values.slice(-30);
            const prev30Days = values.slice(-60, -30);
            const recentAvg = recent30Days.reduce((sum, val) => sum + val, 0) / recent30Days.length;
            const prevAvg = prev30Days.length > 0 ? prev30Days.reduce((sum, val) => sum + val, 0) / prev30Days.length : recentAvg;
            const growthRate = prevAvg > 0 ? ((recentAvg - prevAvg) / prevAvg) * 100 : 0;
            return { maxValue, averageScore, growthRate };
        }
        catch (error) {
            console.error('Error getting trend score:', error);
            return { maxValue: 0, averageScore: 0, growthRate: 0 };
        }
    }
};
exports.TrendsService = TrendsService;
exports.TrendsService = TrendsService = __decorate([
    (0, common_1.Injectable)()
], TrendsService);
