import { Controller, Get } from '@nestjs/common';

@Controller('debug')
export class DebugController {
  @Get('routes')
  getRoutes() {
    return { ok: true, route: 'routes' };
  }

  @Get('youtube-test')
  youtubeTest() {
    return { ok: true, route: 'youtube-test' };
  }
}
