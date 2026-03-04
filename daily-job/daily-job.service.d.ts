import { ScraperService } from '../scraper/scraper.service';
import { GameService } from '../game/game.service';
import { TrendsService } from '../trends/trends.service';
import { YoutubeService } from '../youtube/youtube.service';
import { ScoringService } from '../scoring/scoring.service';
export declare class DailyJobService {
    private scraperService;
    private gameService;
    private trendsService;
    private youtubeService;
    private scoringService;
    private readonly logger;
    constructor(scraperService: ScraperService, gameService: GameService, trendsService: TrendsService, youtubeService: YoutubeService, scoringService: ScoringService);
    executeDailyJob(): Promise<{
        totalScraped: number;
        scored: number;
        worthy: number;
    }>;
    handleCron(): Promise<void>;
}
