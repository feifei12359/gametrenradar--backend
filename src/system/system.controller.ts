import { Controller, Post } from '@nestjs/common';
import { ResponseMessage } from '../common/utils/response-message.decorator';
import { SystemService } from './system.service';

@Controller('system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Post('reset')
  @ResponseMessage('system reset completed')
  reset() {
    return this.systemService.reset();
  }
}
