import { Module } from '@nestjs/common';
import { YoutubeModule } from '../youtube/youtube.module';
import { DebugController } from './debug.controller';

@Module({
  imports: [YoutubeModule],
  controllers: [DebugController],
})
export class DebugModule {}
