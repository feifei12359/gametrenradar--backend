import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { GameModule } from './game/game.module';
import { ScraperModule } from './scraper/scraper.module';
import { TrendsModule } from './trends/trends.module';
import { YoutubeModule } from './youtube/youtube.module';
import { ScoringModule } from './scoring/scoring.module';
import { DailyJobModule } from './daily-job/daily-job.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    GameModule,
    ScraperModule,
    TrendsModule,
    YoutubeModule,
    ScoringModule,
    DailyJobModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
