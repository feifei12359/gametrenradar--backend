import { Module } from '@nestjs/common';
import { NewWordsController } from './new-words.controller';

@Module({
  controllers: [NewWordsController],
})
export class NewWordsModule {}
