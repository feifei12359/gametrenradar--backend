import { Controller, Get } from '@nestjs/common';
import { TrendService } from './trend.service';

@Controller('trend')
export class TrendController {
  constructor(private readonly trendService: TrendService) { }

  @Get('exploding')
  async getExploding() {
    return this.trendService.getExplodingTrends();
  }

  @Get('early')
  async getEarly() {
    return this.trendService.getEarlyTrends();
  }

  @Get('all')
  async getAll() {
    return this.trendService.getAllTrends();
  }
}