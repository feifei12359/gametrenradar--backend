import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { TrendModule } from './trend/trend.module';
import { GameModule } from './game/game.module';
import { DailyJobModule } from './daily-job/daily-job.module';

@Module({
  imports: [TrendModule, GameModule, DailyJobModule],
  controllers: [HealthController],
  providers: [],
})
export class AppModule { }
