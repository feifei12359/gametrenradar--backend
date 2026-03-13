import { Injectable } from '@nestjs/common';
import { YoutubeDiscoveryVideo } from './youtube-crawler.service';

@Injectable()
export class YoutubeEnrichmentService {
  enrich(video: YoutubeDiscoveryVideo) {
    const engagement =
      video.viewCount + video.likeCount * 8 + video.commentCount * 12;

    return {
      ...video,
      engagementScore: engagement,
      velocityScore: Math.min(
        100,
        Math.round((engagement / Math.max(this.hoursSince(video.publishedAt), 1)) * 0.05),
      ),
    };
  }

  private hoursSince(date: Date) {
    return (Date.now() - date.getTime()) / (60 * 60 * 1000);
  }
}
