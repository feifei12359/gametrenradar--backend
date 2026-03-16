import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { normalizeKeyword } from '../../common/utils/normalize-keyword.util';

export type DiscoverGameItem = {
  title: string;
  normalizedTitle: string;
  source: 'roblox_discover';
};

@Injectable()
export class RobloxDiscoverService {
  private readonly logger = new Logger(RobloxDiscoverService.name);
  private readonly discoverUrl = 'https://www.roblox.com/discover';

  async fetchDiscoverGames(): Promise<DiscoverGameItem[]> {
    try {
      const response = await axios.get<string>(this.discoverUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; GameTrendRadar/1.0)',
          Accept: 'text/html,application/xhtml+xml',
        },
        timeout: 10000,
      });
      this.logger.log(`Roblox Discover request succeeded: status=${response.status}`);

      const discoverGames = this.extractDiscoverGames(response.data);
      this.logger.log(`Roblox Discover extractedCandidates=${discoverGames.length}`);
      this.logger.log(`Roblox Discover returned discoverGames.length=${discoverGames.length}`);
      this.logger.log(`Roblox Discover sample=${JSON.stringify(discoverGames.slice(0, 10))}`);

      return discoverGames;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.warn(`Failed to fetch Roblox Discover games: ${message}`);
      return [];
    }
  }

  private extractDiscoverGames(html: string): DiscoverGameItem[] {
    const $ = cheerio.load(html);
    const deduped = new Map<string, DiscoverGameItem>();
    const selectors = [
      'a.game-card-link',
      'a.game-tile-link',
      'div.game-card-name',
      'span.game-card-name',
    ];
    let scriptCandidateCount = 0;

    for (const selector of selectors) {
      $(selector).each((_, element) => {
        const title =
          $(element).attr('title')?.trim() ||
          $(element).text().trim() ||
          '';

        this.pushDiscoverCandidate(deduped, title);
      });
    }

    $('script').each((_, element) => {
      const scriptContent = $(element).html() ?? '';
      const matches = scriptContent.matchAll(/"name":"([^"]+)"/g);

      for (const match of matches) {
        scriptCandidateCount += 1;
        this.pushDiscoverCandidate(deduped, match[1] ?? '');
      }
    });

    const extracted = [...deduped.values()].slice(0, 200);
    this.logger.log(`Roblox Discover scriptCandidates=${scriptCandidateCount}`);
    this.logger.log(`Roblox Discover dedupedCandidates=${extracted.length}`);
    return extracted;
  }

  private pushDiscoverCandidate(
    deduped: Map<string, DiscoverGameItem>,
    rawTitle: string,
  ): void {
    const title = rawTitle.replace(/\s+/g, ' ').trim();
    if (!title || title.length < 3 || title.length > 80) {
      return;
    }

    const normalizedTitle = normalizeKeyword(title);
    if (!normalizedTitle) {
      return;
    }

    if (!deduped.has(normalizedTitle)) {
      deduped.set(normalizedTitle, {
        title,
        normalizedTitle,
        source: 'roblox_discover',
      });
    }
  }
}
