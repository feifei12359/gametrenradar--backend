import { Module } from '@nestjs/common';
import { NewWordsModule } from '../new-words/new-words.module';
import { TrendModule } from '../trend/trend.module';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  imports: [NewWordsModule, TrendModule],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
