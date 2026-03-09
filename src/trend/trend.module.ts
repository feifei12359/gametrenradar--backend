import { Module } from '@nestjs/common';
import { TrendController } from './trend.controller';

@Module({
  controllers: [TrendController],
})
export class TrendModule {}
