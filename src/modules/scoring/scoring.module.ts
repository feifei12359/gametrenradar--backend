import { Module } from '@nestjs/common';
import { KeywordScoringService } from '../../services/keyword-scoring.service';

@Module({
  providers: [KeywordScoringService],
  exports: [KeywordScoringService],
})
export class ScoringModule {}
