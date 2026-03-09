// backend/src/daily-job/daily-job.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class DailyJobService {
  runJob() {
    return { status: 'Daily job executed successfully', timestamp: new Date() };
  }
}
