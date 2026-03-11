import { Controller, Post } from '@nestjs/common';
import { DailyJobService } from '../jobs/daily-job.service';

@Controller('daily-job')
export class DailyJobController {
  constructor(private readonly dailyJobService: DailyJobService) {}

  @Post()
  async runDailyJob() {
    return this.dailyJobService.runFullDetection();
  }

  @Post('clear')
  async clearDatabase() {
    return this.dailyJobService.clearDatabase();
  }
}
