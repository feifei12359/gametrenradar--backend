import { Module } from '@nestjs/common';
import { NewWordsModule } from '../new-words/new-words.module';
import { RobloxDiscoverService } from '../sources/roblox/roblox-discover.service';
import { TrendModule } from '../trend/trend.module';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  imports: [NewWordsModule, TrendModule],
  controllers: [JobsController],
  providers: [JobsService, RobloxDiscoverService],
  exports: [JobsService],
})
export class JobsModule {}
