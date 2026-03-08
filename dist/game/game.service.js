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
var GameService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const axios_1 = require("axios");
let GameService = GameService_1 = class GameService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(GameService_1.name);
    }
    async getAllGames() {
        return this.prisma.game.findMany();
    }
    async createGame(data) {
        return this.prisma.game.create({ data });
    }
    async deleteGame(id) {
        return this.prisma.game.delete({ where: { id } });
    }
    async fetchRobloxGames() {
        try {
            const res = await axios_1.default.get('https://www.roblox.com/games');
            const games = this.parseGamesFromHTML(res.data, 'roblox');
            for (const g of games) {
                await this.prisma.game.upsert({
                    where: { id: g.id },
                    update: g,
                    create: g,
                });
            }
            this.logger.log(`✅ Roblox 数据抓取完成，数量: ${games.length}`);
        }
        catch (err) {
            this.logger.error('抓取 Roblox 错误', err);
        }
    }
    async fetchSteamGames() {
        try {
            const res = await axios_1.default.get('https://store.steampowered.com/search/?filter=popular');
            const games = this.parseGamesFromHTML(res.data, 'steam');
            for (const g of games) {
                await this.prisma.game.upsert({
                    where: { id: g.id },
                    update: g,
                    create: g,
                });
            }
            this.logger.log(`✅ Steam 数据抓取完成，数量: ${games.length}`);
        }
        catch (err) {
            this.logger.error('抓取 Steam 错误', err);
        }
    }
    async fetchIndieGames() {
        try {
            const res = await axios_1.default.get('https://indiegamewebsite.example.com');
            const games = this.parseGamesFromHTML(res.data, 'indie');
            for (const g of games) {
                await this.prisma.game.upsert({
                    where: { id: g.id },
                    update: g,
                    create: g,
                });
            }
            this.logger.log(`✅ Indie 数据抓取完成，数量: ${games.length}`);
        }
        catch (err) {
            this.logger.error('抓取 Indie 错误', err);
        }
    }
    parseGamesFromHTML(html, platform) {
        return [
            { id: 1, name: `${platform} Game 1`, platform },
            { id: 2, name: `${platform} Game 2`, platform },
        ];
    }
};
exports.GameService = GameService;
exports.GameService = GameService = GameService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GameService);
