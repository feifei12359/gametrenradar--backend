"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var YoutubeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.YoutubeService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
let YoutubeService = YoutubeService_1 = class YoutubeService {
    constructor() {
        this.logger = new common_1.Logger(YoutubeService_1.name);
        this.YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'YOUR_API_KEY';
    }
    async getRobloxVideos(days = 7) {
        try {
            this.logger.log(`获取最近 ${days} 天的 Roblox 视频`);
            const publishedAfter = new Date();
            publishedAfter.setDate(publishedAfter.getDate() - days);
            const url = `https://www.googleapis.com/youtube/v3/search`;
            const params = {
                part: 'snippet',
                q: 'Roblox new game',
                type: 'video',
                order: 'date',
                publishedAfter: publishedAfter.toISOString(),
                maxResults: 50,
                key: this.YOUTUBE_API_KEY
            };
            const response = await axios_1.default.get(url, { params });
            const videos = response.data.items.map((item) => ({
                title: item.snippet.title,
                publishedAt: new Date(item.snippet.publishedAt),
                channelTitle: item.snippet.channelTitle,
                videoId: item.id.videoId,
                link: `https://www.youtube.com/watch?v=${item.id.videoId}`
            }));
            this.logger.log(`成功获取 ${videos.length} 个 Roblox 视频`);
            return videos;
        }
        catch (error) {
            this.logger.error('获取 YouTube 视频失败:', error);
            return this.getStableMockVideos(days);
        }
    }
    getStableMockVideos(days) {
        const mockVideos = [
            {
                title: 'Anime Last Stand - NEW Roblox Game 2026',
                publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                channelTitle: 'Roblox Gamer',
                videoId: 'anime_last_stand',
                link: 'https://www.youtube.com/watch?v=anime_last_stand'
            },
            {
                title: 'Grow A Garden - Roblox New Update',
                publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                channelTitle: 'Game Master',
                videoId: 'grow_a_garden',
                link: 'https://www.youtube.com/watch?v=grow_a_garden'
            },
            {
                title: 'Blade Ball - Roblox Trending Game',
                publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                channelTitle: 'Trend Hunter',
                videoId: 'blade_ball',
                link: 'https://www.youtube.com/watch?v=blade_ball'
            },
            {
                title: 'Type Soul - Roblox New Release',
                publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
                channelTitle: 'Anime Games',
                videoId: 'type_soul',
                link: 'https://www.youtube.com/watch?v=type_soul'
            },
            {
                title: "Sol's RNG - Roblox New Game",
                publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                channelTitle: 'RNG Master',
                videoId: 'sols_rng',
                link: 'https://www.youtube.com/watch?v=sols_rng'
            },
            {
                title: 'Tower Defense Simulator - Roblox Game',
                publishedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
                channelTitle: 'Tower Defense',
                videoId: 'tower_defense_sim',
                link: 'https://www.youtube.com/watch?v=tower_defense_sim'
            },
            {
                title: 'Anime Battlegrounds - Roblox New',
                publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                channelTitle: 'Anime Battle',
                videoId: 'anime_battlegrounds',
                link: 'https://www.youtube.com/watch?v=anime_battlegrounds'
            }
        ];
        return mockVideos.filter(video => {
            const daysDiff = (new Date().getTime() - video.publishedAt.getTime()) / (1000 * 60 * 60 * 24);
            return daysDiff <= days;
        });
    }
    async getVideoStatistics(videoId) {
        var _a;
        try {
            const url = `https://www.googleapis.com/youtube/v3/videos`;
            const params = {
                part: 'statistics',
                id: videoId,
                key: this.YOUTUBE_API_KEY
            };
            const response = await axios_1.default.get(url, { params });
            return ((_a = response.data.items[0]) === null || _a === void 0 ? void 0 : _a.statistics) || {
                viewCount: Math.floor(Math.random() * 10000) + 1000
            };
        }
        catch (error) {
            this.logger.error('获取视频统计失败:', error);
            return {
                viewCount: Math.floor(Math.random() * 10000) + 1000
            };
        }
    }
};
exports.YoutubeService = YoutubeService;
exports.YoutubeService = YoutubeService = YoutubeService_1 = __decorate([
    (0, common_1.Injectable)()
], YoutubeService);
