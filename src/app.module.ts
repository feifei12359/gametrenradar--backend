import { Module } from '@nestjs/common';
import { GameController } from './game/game.controller';

@Module({
  imports: [],
  controllers: [GameController],
  providers: [],
})
export class AppModule {}
