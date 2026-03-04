import { Controller, Get } from '@nestjs/common';

@Controller('new-words')
export class NewWordsController {

  @Get()
  getNewWords() {
    return {
      items: [
        { token: 'Quantum Jump', noveltyScore: 95, recentCount: 3, totalCount: 3, firstSeenAt: new Date() },
        { token: 'Neon Racer', noveltyScore: 88, recentCount: 2, totalCount: 2, firstSeenAt: new Date() }
      ]
    };
  }

}
