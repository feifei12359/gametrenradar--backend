import { Body, Controller, Post } from '@nestjs/common';
import { BatchExtractKeywordDto } from './dto/batch-extract-keyword.dto';
import { ExtractKeywordDto } from './dto/extract-keyword.dto';
import { KeywordDebugService } from './keyword-debug.service';

@Controller('keywords')
export class KeywordsController {
  constructor(private readonly keywordDebugService: KeywordDebugService) {}

  @Post('extract')
  extract(@Body() body: ExtractKeywordDto) {
    return this.keywordDebugService.debugExtract(body);
  }

  @Post('batch-extract')
  batchExtract(@Body() body: BatchExtractKeywordDto) {
    return this.keywordDebugService.batchDebugExtract(body);
  }
}
