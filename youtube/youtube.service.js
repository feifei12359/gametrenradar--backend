"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YoutubeService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
let YoutubeService = class YoutubeService {
    constructor(configService) {
        this.configService = configService;
        this.apiKey = this.configService.get('YOUTUBE_API_KEY', '');
        this.warnedNoKey = false;
    }
    async getYoutubeScore(gameName) {
        try {
            if (!this.apiKey) {
                this.warnedNoKey = true;
                return { videoCount: 0, apiAvailable: false };
            }
            const searchQuery = `${gameName} gameplay`;
            const url = `https://www.googleapis.com/youtube/v3/search`;
            const response = await axios_1.default.get(url, {
                params: {
                    key: this.apiKey,
                    q: searchQuery,
                    part: 'snippet',
                    type: 'video',
                    publishedAfter: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                    maxResults: 50,
                },
            });
            const videoCount = response.data.items ? response.data.items.length : 0;
            return { videoCount, apiAvailable: true };
        }
        catch (error) {
            console.error('Error getting YouTube score:', error);
            return { videoCount: 0, apiAvailable: false };
        }
    }
};
exports.YoutubeService = YoutubeService;
exports.YoutubeService = YoutubeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], YoutubeService);
