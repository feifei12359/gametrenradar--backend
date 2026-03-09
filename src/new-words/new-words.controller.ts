import { Controller, Get } from '@nestjs/common';

@Controller('new-words')
export class NewWordsController {
  @Get()
  getNewWords() {
    return {
      items: [
        { token: '新词1', noveltyScore: 90, recentCount: 5, totalCount: 10, firstSeenAt: new Date() },
        { token: '新词2', noveltyScore: 85, recentCount: 3, totalCount: 8, firstSeenAt: new Date() },
      ]
    };
  }
}
