import { Module } from '@nestjs/common';
import { RobloxDiscoverService } from '../sources/roblox/roblox-discover.service';
import { TrendController } from './trend.controller';
import { TrendService } from './trend.service';

@Module({
  controllers: [TrendController],
  providers: [TrendService, RobloxDiscoverService],
  exports: [TrendService],
})
export class TrendModule {}
