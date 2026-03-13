import { Module } from '@nestjs/common';
import { KeywordDebugService } from './keyword-debug.service';
import { KeywordExtractionService } from './keyword-extraction.service';
import { KeywordFilterService } from './keyword-filter.service';
import { KeywordNormalizerService } from './keyword-normalizer.service';
import { KeywordRepository } from './keyword.repository';
import { KeywordsController } from './keywords.controller';

@Module({
  controllers: [KeywordsController],
  providers: [
    KeywordRepository,
    KeywordNormalizerService,
    KeywordExtractionService,
    KeywordFilterService,
    KeywordDebugService,
  ],
  exports: [
    KeywordRepository,
    KeywordNormalizerService,
    KeywordExtractionService,
    KeywordFilterService,
    KeywordDebugService,
  ],
})
export class KeywordsModule {}
