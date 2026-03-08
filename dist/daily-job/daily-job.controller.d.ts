import { DailyJobService } from './daily-job.service';
export declare class DailyJobController {
    private dailyJobService;
    constructor(dailyJobService: DailyJobService);
    runDailyJob(): Promise<{
        totalScraped: number;
        scored: number;
        worthy: number;
    }>;
}
