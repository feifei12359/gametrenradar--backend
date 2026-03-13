import { Controller, Get } from '@nestjs/common';
import { ResponseMessage } from '../common/utils/response-message.decorator';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('summary')
  @ResponseMessage('stats summary fetched')
  getSummary() {
    return this.statsService.getSummary();
  }
}
