import { Controller, Get } from '@nestjs/common';

@Controller('health') // 注意不要写 /api/health
export class HealthController {
  @Get()
  healthCheck() {
    return { status: 'ok' };
  }
}
