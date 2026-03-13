import { Controller, Get, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { YoutubeService } from '../youtube/youtube.service';

@Controller('debug')
export class DebugController {
  constructor(private readonly youtubeService: YoutubeService) {}

  @Get('routes')
  getRoutes(@Req() req: Request) {
    const app: any = req.app;
    const routes: Array<{ method: string; path: string }> = [];

    const collectRoutes = (stack: any[], prefix = '') => {
      for (const layer of stack || []) {
        if (layer.route && layer.route.path) {
          const path = `${prefix}${layer.route.path}`;
          const methods = Object.keys(layer.route.methods || {});
          methods.forEach((method) => {
            routes.push({
              method: method.toUpperCase(),
              path,
            });
          });
        } else if (layer.name === 'router' && layer.handle?.stack) {
          collectRoutes(layer.handle.stack, prefix);
        }
      }
    };

    collectRoutes(app?._router?.stack || []);

    return {
      success: true,
      count: routes.length,
      routes,
    };
  }

  @Get('youtube-test')
  youtubeTest(
    @Query('region') region: string = 'US',
    @Query('q') query: string = 'roblox new game',
  ) {
    return this.youtubeService.debugYoutubeSearch(region, query, 3);
  }
}
