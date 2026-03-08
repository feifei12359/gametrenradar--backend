import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { GameModule } from './game/game.module';
import { TrendModule } from './trend/trend.module';

@Module({
  imports: [GameModule, TrendModule],
  controllers: [HealthController],
})
export class AppModule {}
