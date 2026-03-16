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

      const rawGames = this.extractDiscoverGames(response.data);
      this.logger.log(`Roblox Discover rawCandidates=${rawGames.length}`);
      this.logger.log(`Roblox Discover rawCandidates.sample=${JSON.stringify(rawGames.slice(0, 10))}`);

      const deduped = new Map<string, DiscoverGameItem>();

      for (const rawTitle of rawGames) {
        const title = rawTitle.replace(/\s+/g, ' ').trim();
        if (!title || title.length < 3 || title.length > 80) {
          continue;
        }

        const normalizedTitle = normalizeKeyword(title);
        if (!normalizedTitle) {
          continue;
        }

        if (!deduped.has(normalizedTitle)) {
          deduped.set(normalizedTitle, {
            title,
            normalizedTitle,
            source: 'roblox_discover',
          });
        }
      }

      const discoverGames = [...deduped.values()].slice(0, 200);
      this.logger.log(`Roblox Discover dedupedCandidates=${discoverGames.length}`);
      this.logger.log(`Roblox Discover discoverGames.length=${discoverGames.length}`);
      this.logger.log(`Roblox Discover discoverGames.sample=${JSON.stringify(discoverGames.slice(0, 10))}`);

      return discoverGames;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.warn(`Failed to fetch Roblox Discover games: ${message}`);
      return [];
    }
  }

  private extractDiscoverGames(html: string): string[] {
    const $ = cheerio.load(html);
    const candidates: string[] = [];

    const selectors = [
      '[title]',
      'a.game-card-link',
      'a.game-tile-link',
      'div.game-card-name',
      'span.game-card-name',
      'h3',
      'h2',
    ];

    for (const selector of selectors) {
      $(selector).each((_, el) => {
        const title =
          $(el).attr('title')?.trim() ||
          $(el).text().trim() ||
          '';

        if (title) {
          candidates.push(title);
        }
      });
    }

    $('script').each((_, el) => {
      const scriptContent = $(el).html() ?? '';
      const matches = scriptContent.matchAll(/"name":"([^"]+)"/g);

      for (const match of matches) {
        if (match[1]) {
          candidates.push(match[1]);
        }
      }
    });

    this.logger.log(`Roblox Discover extractedCandidates=${candidates.length}`);
    return candidates;
  }
}
