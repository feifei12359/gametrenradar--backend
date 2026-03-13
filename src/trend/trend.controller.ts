import { Controller, Get } from '@nestjs/common';
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
}
