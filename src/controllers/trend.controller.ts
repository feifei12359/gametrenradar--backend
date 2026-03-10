import { Controller, Get } from '@nestjs/common';
import { TrendService } from '../services/trend.service';
import { TokenService } from '../services/token.service';
import { DailyJobService } from '../jobs/daily-job.service';

@Controller()
export class TrendController {
  constructor(
    private readonly trendService: TrendService,
    private readonly tokenService: TokenService,
    private readonly dailyJobService: DailyJobService
  ) {}

  @Get('/trend/exploding')
  async getExplodingTrends() {
    return this.trendService.getExplodingTrends();
  }

  @Get('/trend/early')
  async getEarlyTrends() {
    return this.trendService.getEarlyTrends();
  }

  @Get('/trend/all')
  async getAllTrends() {
    return this.trendService.getAllTrends();
  }

  @Get('/new-words')
  async getNewWords() {
    return this.tokenService.getNewWords();
  }

  @Get('/daily-job')
  async runFullDetection() {
    return this.dailyJobService.runFullDetection();
  }
}
