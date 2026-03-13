import { Controller, Get } from '@nestjs/common';
import { ResponseMessage } from '../common/utils/response-message.decorator';

@Controller('health')
export class HealthController {
  @Get()
  @ResponseMessage('healthy')
  getHealth() {
    return {
      status: 'ok',
    };
  }
}
