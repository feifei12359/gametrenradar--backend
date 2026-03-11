// backend/src/daily-job/daily-job.module.ts
import { Module } from '@nestjs/common';
import { DailyJobService } from './daily-job.service';

@Module({
  providers: [DailyJobService],
})
export class DailyJobModule { }
