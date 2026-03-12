import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';

@Controller('debug')
export class DebugController {
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
}