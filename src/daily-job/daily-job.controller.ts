import { Controller, Post } from '@nestjs/common';

@Controller('daily-job')
export class DailyJobController {

  @Post()
  runDailyJob() {
    return {
      success: true,
      message: 'Daily trend analysis triggered',
    };
  }

}
