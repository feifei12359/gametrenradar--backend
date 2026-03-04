import { Module } from '@nestjs/common'
import { TrendsService } from './trends.service'

@Module({
  providers: [TrendsService],
  exports: [TrendsService],
})
export class TrendsModule {}
