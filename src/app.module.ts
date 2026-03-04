import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { PrismaModule } from './prisma/prisma.module'
import { GameModule } from './game/game.module'
import { ScraperModule } from './scraper/scraper.module'
import { DailyJobModule } from './daily-job/daily-job.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    GameModule,
    ScraperModule,
    DailyJobModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
