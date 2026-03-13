import { Controller, Get } from '@nestjs/common';

console.log('DEBUG_CONTROLLER_VERSION=2026-03-13-youtube-test-1');

@Controller('debug')
export class DebugController {
  @Get('routes')
  getRoutes() {
    return { ok: true, route: 'routes' };
  }

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
