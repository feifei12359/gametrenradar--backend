import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { JobsModule } from './jobs/jobs.module';
import { NewWordsModule } from './new-words/new-words.module';
import { PrismaModule } from './prisma/prisma.module';
import { StatsModule } from './stats/stats.module';
import { SystemModule } from './system/system.module';
import { TrendModule } from './trend/trend.module';

@Module({
  imports: [PrismaModule, TrendModule, NewWordsModule, JobsModule, SystemModule, StatsModule],
  controllers: [HealthController],
})
export class AppModule {}
