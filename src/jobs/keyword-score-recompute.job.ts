import { Injectable, Logger } from '@nestjs/common';
import * as cron from 'node-cron';
import { KeywordRepository } from '../modules/keywords/keyword.repository';
import { DiscoveryPipelineService } from '../services/discovery-pipeline.service';

@Injectable()
export class KeywordScoreRecomputeJob {
  private readonly logger = new Logger(KeywordScoreRecomputeJob.name);

  constructor(
    private readonly keywordRepository: KeywordRepository,
    private readonly discoveryPipelineService: DiscoveryPipelineService,
  ) {
    cron.schedule('15 */4 * * *', async () => {
      this.logger.log('Starting keyword score recompute job');
      const keywords = await this.keywordRepository.listKeywordsForScoring();
      for (const keyword of keywords) {
        await this.discoveryPipelineService.recomputeKeywordScore(keyword.id);
      }
      this.logger.log('Completed keyword score recompute job');
    });
  }
}
