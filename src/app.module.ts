import { Module } from '@nestjs/common';
import { DebugModule } from './debug/debug.module';
import { HealthController } from './health/health.controller';
import { DiscoveryModule } from './modules/discovery/discovery.module';
import { KeywordsModule } from './modules/keywords/keywords.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, DebugModule, KeywordsModule, DiscoveryModule],
  controllers: [HealthController],
})
export class AppModule {}
