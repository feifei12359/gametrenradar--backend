import { Controller, Post } from '@nestjs/common';

@Controller('daily-job')
export class DailyJobController {
  @Post()
  runJob() {
    console.log('🟢 Daily Job triggered');
    return { success: true, message: 'Daily job triggered' };
  }
}
