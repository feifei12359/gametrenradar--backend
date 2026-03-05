import { Module } from '@nestjs/common';
import { GameModule } from './game/game.module';
import { TrendModule } from './trend/trend.module';

@Module({
  imports: [GameModule, TrendModule],
})
export class AppModule { }
