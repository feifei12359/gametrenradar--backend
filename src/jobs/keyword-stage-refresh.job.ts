import { Injectable, Logger } from '@nestjs/common';
import * as cron from 'node-cron';
import { KeywordRepository } from '../modules/keywords/keyword.repository';
import { DiscoveryPipelineService } from '../services/discovery-pipeline.service';

@Injectable()
export class KeywordStageRefreshJob {
  private readonly logger = new Logger(KeywordStageRefreshJob.name);

  constructor(
    private readonly keywordRepository: KeywordRepository,
    private readonly discoveryPipelineService: DiscoveryPipelineService,
  ) {
    cron.schedule('45 */8 * * *', async () => {
      this.logger.log('Starting keyword stage refresh job');
      const keywords = await this.keywordRepository.listKeywordsForScoring();
      for (const keyword of keywords) {
        await this.discoveryPipelineService.refreshHistoricalStats(
          keyword.canonical_name,
          keyword.region,
        );
        await this.discoveryPipelineService.recomputeKeywordScore(keyword.id);
      }
      this.logger.log('Completed keyword stage refresh job');
    });
  }
}
