import { Module } from '@nestjs/common';
import { YoutubeRegionCrawlJob } from '../../jobs/youtube-region-crawl.job';
import { KeywordScoreRecomputeJob } from '../../jobs/keyword-score-recompute.job';
import { KeywordStageRefreshJob } from '../../jobs/keyword-stage-refresh.job';
import { DiscoveryPipelineService } from '../../services/discovery-pipeline.service';
import { KeywordsModule } from '../keywords/keywords.module';
import { RobloxModule } from '../roblox/roblox.module';
import { ScoringModule } from '../scoring/scoring.module';
import { TrendsModule } from '../trends/trends.module';
import { YoutubeModule } from '../youtube/youtube.module';
import { DiscoveryController } from './discovery.controller';
import { DiscoveryService } from './discovery.service';

@Module({
  imports: [
    YoutubeModule,
    RobloxModule,
    TrendsModule,
    KeywordsModule,
    ScoringModule,
  ],
  controllers: [DiscoveryController],
  providers: [
    DiscoveryService,
    DiscoveryPipelineService,
    YoutubeRegionCrawlJob,
    KeywordScoreRecomputeJob,
    KeywordStageRefreshJob,
  ],
  exports: [DiscoveryService, DiscoveryPipelineService],
})
export class DiscoveryModule {}
