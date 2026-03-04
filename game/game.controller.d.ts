import { GameService } from './game.service';
import { Game } from '@prisma/client';
export declare class GameController {
    private gameService;
    constructor(gameService: GameService);
    getGames(minScore?: number): Promise<Game[]>;
    seedGames(): Promise<{
        message: string;
        count: number;
    }>;
}
