import { PrismaService } from '../prisma/prisma.service';
import { Game } from '@prisma/client';
export declare class GameService {
    private prisma;
    constructor(prisma: PrismaService);
    getGames(minScore?: number): Promise<Game[]>;
    createGame(gameData: {
        gameName: string;
        source: string;
        url: string;
        publishDate: Date;
        tags?: string;
    }): Promise<Game>;
    updateGame(id: number, data: Partial<Game>): Promise<Game>;
    findByUrl(url: string): Promise<Game | null>;
    getRecentGames(days: number): Promise<Game[]>;
}
