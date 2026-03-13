import { Module } from '@nestjs/common';
import { NewWordsController } from './new-words.controller';
import { NewWordsService } from './new-words.service';

@Module({
  controllers: [NewWordsController],
  providers: [NewWordsService],
  exports: [NewWordsService],
})
export class NewWordsModule {}
