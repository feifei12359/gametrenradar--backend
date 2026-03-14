import { Module } from '@nestjs/common';
import { RobloxDiscoverService } from '../sources/roblox/roblox-discover.service';
import { RobloxSearchService } from '../sources/roblox/roblox-search.service';
import { TrendController } from './trend.controller';
import { TrendService } from './trend.service';

@Module({
  controllers: [TrendController],
  providers: [TrendService, RobloxDiscoverService, RobloxSearchService],
  exports: [TrendService],
})
export class TrendModule {}
