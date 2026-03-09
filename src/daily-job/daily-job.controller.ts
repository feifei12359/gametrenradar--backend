// backend/src/daily-job/daily-job.controller.ts
import { Controller, Post } from '@nestjs/common';
import { DailyJobService } from './daily-job.service';

@Controller('daily-job')
export class DailyJobController {
  constructor(private readonly dailyJobService: DailyJobService) {}

  @Post() runJob() {
    return this.dailyJobService.runJob();
  }
}
