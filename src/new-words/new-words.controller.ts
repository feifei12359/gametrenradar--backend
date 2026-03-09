import { Controller, Get } from '@nestjs/common';

@Controller('new-words')
export class NewWordsController {

  @Get()
  getNewWords() {
    return {
      items: [
        {
          token: '新词1',
          noveltyScore: 92,
          recentCount: 6,
          totalCount: 12,
          firstSeenAt: new Date(),
        },
        {
          token: '新词2',
          noveltyScore: 85,
          recentCount: 3,
          totalCount: 7,
          firstSeenAt: new Date(),
        },
      ],
    };
  }
}
