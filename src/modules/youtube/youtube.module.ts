import { Module } from '@nestjs/common';
import { YoutubeCrawlerService } from '../../services/youtube-crawler.service';
import { YoutubeEnrichmentService } from '../../services/youtube-enrichment.service';

@Module({
  providers: [YoutubeCrawlerService, YoutubeEnrichmentService],
  exports: [YoutubeCrawlerService, YoutubeEnrichmentService],
})
export class YoutubeModule {}
