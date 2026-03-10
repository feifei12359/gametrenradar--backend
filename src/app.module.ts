// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { TrendModule } from './trend/trend.module';
import { GameModule } from './game/game.module';
import { DailyJobModule } from './daily-job/daily-job.module';
import { NewWordsModule } from './newwords/newwords.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, TrendModule, GameModule, DailyJobModule, NewWordsModule],
})
export class AppModule { }
