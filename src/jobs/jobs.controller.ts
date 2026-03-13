import { Body, Controller, Get, Post } from '@nestjs/common';
import { ResponseMessage } from '../common/utils/response-message.decorator';
import { RunDailyJobDto } from './dto/run-daily-job.dto';
import { JobsService } from './jobs.service';

@Controller('daily-job')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  @ResponseMessage('daily job status fetched')
  getLatest() {
    return this.jobsService.getLatestJob();
  }

  @Post()
  @ResponseMessage('daily job completed')
  run(@Body() dto: RunDailyJobDto) {
    return this.jobsService.runDailyJob(dto);
  }

  @Post('clear')
  @ResponseMessage('daily job history cleared')
  clear() {
    return this.jobsService.clear();
  }
}
