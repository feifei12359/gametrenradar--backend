import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health/health.controller';
import { TrendController } from './trend/trend.controller';
import { NewWordsController } from './new-words/new-words.controller';
import { TokenService } from './services/token.service';
import { TrendService } from './services/trend.service';
import { DailyJobService } from './jobs/daily-job.service';
import { YoutubeService } from './youtube/youtube.service';
import { GoogleTrendsService } from './services/google-trends.service';
import { AIScoreService } from './services/ai-score.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    HealthController,
    TrendController,
    NewWordsController
  ],
  providers: [
    TokenService,
    TrendService,
    DailyJobService,
    YoutubeService,
    GoogleTrendsService,
    AIScoreService
  ],
})
export class AppModule { }