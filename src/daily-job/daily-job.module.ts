// backend/src/daily-job/daily-job.module.ts
import { Module } from '@nestjs/common';
import { DailyJobController } from './daily-job.controller';
import { DailyJobService } from './daily-job.service';

@Module({
  controllers: [DailyJobController],
  providers: [DailyJobService],
})
export class DailyJobModule {}
