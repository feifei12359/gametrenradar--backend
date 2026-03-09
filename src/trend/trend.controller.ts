// backend/src/trend/trend.controller.ts
import { Controller, Get } from '@nestjs/common';
import { TrendService } from './trend.service';

@Controller('trend')
export class TrendController {
  constructor(private readonly trendService: TrendService) { }

  @Get('exploding') getExploding() { return this.trendService.getExploding(); }
  @Get('early') getEarly() { return this.trendService.getEarly(); }
  @Get('all') getAll() { return this.trendService.getAll(); }
}
