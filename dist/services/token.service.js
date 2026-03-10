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
var TokenService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TokenService = TokenService_1 = class TokenService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(TokenService_1.name);
    }
    async analyzeTokens(tokens) {
        this.logger.log('开始分析关键词');
        for (const token of tokens) {
            try {
                const existingWord = await this.prisma.newWord.findUnique({
                    where: { token }
                });
                if (existingWord) {
                    await this.prisma.newWord.update({
                        where: { token },
                        data: {
                            recent_count: existingWord.recent_count + 1,
                            total_count: existingWord.total_count + 1,
                            novelty_score: (existingWord.recent_count + 1) / (existingWord.total_count + 1)
                        }
                    });
                }
                else {
                    await this.prisma.newWord.create({
                        data: {
                            token,
                            novelty_score: 1.0,
                            recent_count: 1,
                            total_count: 1,
                            first_seen_at: new Date()
                        }
                    });
                }
            }
            catch (error) {
                this.logger.error(`分析关键词 ${token} 失败:`, error);
            }
        }
    }
    async getNewWords() {
        const newWords = await this.prisma.newWord.findMany({
            orderBy: { novelty_score: 'desc' },
            take: 100
        });
        return {
            items: newWords.map(word => ({
                token: word.token,
                noveltyScore: word.novelty_score,
                recentCount: word.recent_count,
                totalCount: word.total_count,
                firstSeenAt: word.first_seen_at.toISOString().split('T')[0]
            }))
        };
    }
    async calculateWordFrequency(tokens) {
        const frequencyMap = new Map();
        for (const token of tokens) {
            frequencyMap.set(token, (frequencyMap.get(token) || 0) + 1);
        }
        return frequencyMap;
    }
};
exports.TokenService = TokenService;
exports.TokenService = TokenService = TokenService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TokenService);
