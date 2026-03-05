import { Module } from '@nestjs/common';
import { TrendController } from './trend.controller';

@Module({
  controllers: [TrendController],
  providers: [],
  exports: [],
})
export class TrendModule {}
