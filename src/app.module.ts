import { Module } from '@nestjs/common';
import { TrendModule } from './trend/trend.module';
import { NewWordsModule } from './new-words/new-words.module';
import { DailyJobModule } from './daily-job/daily-job.module';

@Module({
  imports: [TrendModule, NewWordsModule, DailyJobModule],
})
export class AppModule {}
