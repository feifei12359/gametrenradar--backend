import { Module } from '@nestjs/common';
import { TrendsValidationService } from '../../services/trends-validation.service';

@Module({
  providers: [TrendsValidationService],
  exports: [TrendsValidationService],
})
export class TrendsModule {}
