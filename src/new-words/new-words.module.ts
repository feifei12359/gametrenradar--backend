import { Module } from '@nestjs/common';
import { KeywordExtractionService } from '../keywords/keyword-extraction.service';
import { KeywordFilterService } from '../keywords/keyword-filter.service';
import { YoutubeSourceService } from '../sources/youtube/youtube-source.service';
import { NewWordsController } from './new-words.controller';
import { NewWordsService } from './new-words.service';

@Module({
  controllers: [NewWordsController],
  providers: [
    NewWordsService,
    YoutubeSourceService,
    KeywordExtractionService,
    KeywordFilterService,
  ],
  exports: [NewWordsService],
})
export class NewWordsModule {}
