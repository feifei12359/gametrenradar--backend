import { Injectable, Logger } from '@nestjs/common';
import * as cron from 'node-cron';
import { TARGET_REGIONS } from '../discovery/discovery.constants';
import { DiscoveryPipelineService } from '../services/discovery-pipeline.service';

@Injectable()
export class YoutubeRegionCrawlJob {
  private readonly logger = new Logger(YoutubeRegionCrawlJob.name);

  constructor(private readonly discoveryPipelineService: DiscoveryPipelineService) {
    cron.schedule('0 */6 * * *', async () => {
      this.logger.log('Starting scheduled YouTube region crawl job');
      for (const region of TARGET_REGIONS) {
        await this.discoveryPipelineService.runDiscoveryForRegion(region);
      }
      this.logger.log('Completed scheduled YouTube region crawl job');
    });
  }
}
