import { Module } from '@nestjs/common';
import { KeywordExtractionService } from '../keywords/keyword-extraction.service';
import { KeywordFilterService } from '../keywords/keyword-filter.service';
import { KeywordNormalizerService } from '../keywords/keyword-normalizer.service';
import { YoutubeSourceService } from '../sources/youtube/youtube-source.service';
import { NewWordsController } from './new-words.controller';
import { NewWordsService } from './new-words.service';

@Module({
  controllers: [NewWordsController],
  providers: [
    NewWordsService,
    YoutubeSourceService,
    KeywordExtractionService,
    KeywordNormalizerService,
    KeywordFilterService,
  ],
  exports: [NewWordsService],
})
export class NewWordsModule {}
