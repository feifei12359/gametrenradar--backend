import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health/health.controller';
import { TrendController } from './controllers/trend.controller';
import { CrawlerService } from './services/crawler.service';
import { TokenService } from './services/token.service';
import { AIScoreService } from './services/ai-score.service';
import { TrendService } from './services/trend.service';
import { DailyJobService } from './jobs/daily-job.service';

@Module({
  imports: [PrismaModule],
  controllers: [HealthController, TrendController],
  providers: [
    CrawlerService,
    TokenService,
    AIScoreService,
    TrendService,
    DailyJobService
  ],
})
export class AppModule { }
