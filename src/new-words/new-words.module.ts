import { Module } from '@nestjs/common';
import { NewWordsController } from './new-words.controller';
import { TokenService } from '../services/token.service';
import { YoutubeService } from '../youtube/youtube.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NewWordsController],
  providers: [TokenService, YoutubeService]
})
export class NewWordsModule { }
