import { Controller, Get, Query } from '@nestjs/common';
import { ResponseMessage } from '../common/utils/response-message.decorator';
import { TrendService } from './trend.service';

@Controller('trend')
export class TrendController {
  constructor(private readonly trendService: TrendService) {}

  @Get('exploding')
  @ResponseMessage('exploding trends fetched')
  getExploding() {
    return this.trendService.getExploding();
  }

  @Get('early')
  @ResponseMessage('early trends fetched')
  getEarly() {
    return this.trendService.getEarly();
  }

  @Get('all')
  @ResponseMessage('all trends fetched')
  getAll() {
    return this.trendService.getAll();
  }

  @Get('top')
  @ResponseMessage('top trends fetched')
  getTop(@Query('limit') limit?: string) {
    return this.trendService.getTop(limit ? Number(limit) : undefined);
  }
}
