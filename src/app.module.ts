import { Module } from '@nestjs/common';
import { GameController } from './game/game.controller';
import { TrendController } from './trend/trend.controller';

@Module({
  imports: [],
  controllers: [GameController, TrendController],
  providers: [],
})
export class AppModule {}
