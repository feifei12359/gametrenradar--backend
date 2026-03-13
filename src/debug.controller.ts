import { Controller, Get } from '@nestjs/common';

@Controller('debug')
export class DebugController {
  @Get('youtube-test')
  youtubeTest() {
    return {
      ok: true,
      route: 'youtube-test',
      controller: 'DebugController',
      timestamp: new Date().toISOString(),
    };
  }
}
