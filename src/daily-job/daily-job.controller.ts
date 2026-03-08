import { Controller, Post } from '@nestjs/common';

@Controller('daily-job')
export class DailyJobController {
  @Post()
  runDailyJob() {
    // 执行定时任务逻辑
    return { ok: true, message: 'Daily job executed' };
  }
}