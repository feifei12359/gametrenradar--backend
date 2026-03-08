"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.YoutubeService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
let YoutubeService = class YoutubeService {
    constructor(configService) {
        this.configService = configService;
        this.apiKey = this.configService.get('YOUTUBE_API_KEY', '');
    }
    async getYoutubeScore(gameName) {
        try {
            if (!this.apiKey) {
                console.warn('YouTube API key not set');
                return 0;
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
            const videoCount = response.data.items.length;
            return videoCount >= 3 ? 1 : 0;
        }
        catch (error) {
            console.error('Error getting YouTube score:', error);
            return 0;
        }
    }
};
exports.YoutubeService = YoutubeService;
exports.YoutubeService = YoutubeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], YoutubeService);
//# sourceMappingURL=youtube.service.js.map