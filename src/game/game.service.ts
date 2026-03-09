// backend/src/game/game.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class GameService {
  getGames() {
    return [
      { id:1, name: 'Space Shooter', platform: 'steam' },
      { id:2, name: 'Puzzle Master', platform: 'roblox' },
    ];
  }

  createGame(gameData: any) {
    console.log('Creating game:', gameData);
    return gameData;
  }
}
