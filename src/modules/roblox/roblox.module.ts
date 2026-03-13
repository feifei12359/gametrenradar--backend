import { Module } from '@nestjs/common';
import { RobloxValidationService } from '../../services/roblox-validation.service';

@Module({
  providers: [RobloxValidationService],
  exports: [RobloxValidationService],
})
export class RobloxModule {}
