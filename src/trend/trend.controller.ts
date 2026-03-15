import { Controller, Get, Post, Query } from '@nestjs/common';
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

  @Get('timeline')
  @ResponseMessage('trend timeline fetched')
  getTimeline(@Query('keyword') keyword: string, @Query('days') days?: string) {
    return this.trendService.getTimeline(keyword, days ? Number(days) : undefined);
  }

  @Get('version')
  getVersion() {
    return {
      ok: true,
      version: 'trend-service-opportunity-v1',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('clear')
  @ResponseMessage('trend data cleared')
  clear() {
    return this.trendService.clearAll();
  }
}
