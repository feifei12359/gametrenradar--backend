import { Module } from '@nestjs/common';
import { NewWordsController } from './newwords.controller';

@Module({
  controllers: [NewWordsController],
})
export class NewWordsModule {}
