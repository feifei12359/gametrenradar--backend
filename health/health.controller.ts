import { Controller, Get } from '@nestjs/common';

@Controller('health') // 配合全局前缀 api，最终路由是 /api/health
export class HealthController {
  @Get()
  healthCheck() {
    return { status: 'ok' };
  }
}
