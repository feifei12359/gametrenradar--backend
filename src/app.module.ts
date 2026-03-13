import { Module } from '@nestjs/common';
import { DebugController } from './debug.controller';
import { HealthController } from './health/health.controller';
import { DiscoveryModule } from './modules/discovery/discovery.module';
import { KeywordsModule } from './modules/keywords/keywords.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, KeywordsModule, DiscoveryModule],
  controllers: [HealthController, DebugController],
})
export class AppModule {}
