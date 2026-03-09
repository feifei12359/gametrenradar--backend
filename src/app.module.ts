// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { TrendModule } from './trend/trend.module';
import { GameModule } from './game/game.module';
import { DailyJobModule } from './daily-job/daily-job.module';
import { PrismaModule } from './prisma/prisma.module'; // 如果用 Prisma

@Module({
  imports: [PrismaModule, TrendModule, GameModule, DailyJobModule],
})
export class AppModule { }
