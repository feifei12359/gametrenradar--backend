import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { normalizeKeyword } from '../../common/utils/normalize-keyword.util';

export type RobloxSearchResult = {
  exists: boolean;
  title?: string;
  normalizedTitle?: string;
};

@Injectable()
export class RobloxSearchService {
  private readonly logger = new Logger(RobloxSearchService.name);
  private readonly baseUrl = 'https://www.roblox.com/search/games';

  async searchGame(keyword: string): Promise<RobloxSearchResult> {
    const url = `${this.baseUrl}?keyword=${encodeURIComponent(keyword)}`;

    try {
      const response = await axios.get<string>(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; GameTrendRadar/1.0)',
          Accept: 'text/html,application/xhtml+xml',
        },
        timeout: 10000,
      });

      return this.extractBestMatch(response.data, keyword);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.warn(`Failed Roblox search for "${keyword}": ${message}`);
      return { exists: false };
    }
  }

  private extractBestMatch(html: string, keyword: string): RobloxSearchResult {
    const $ = cheerio.load(html);
    const requested = normalizeKeyword(keyword);
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
      $(selector).each((_, element) => {
        const title =
          $(element).attr('title')?.trim() ||
          $(element).text().trim() ||
          '';

        if (title) {
          candidates.push(title);
        }
      });
    }

    for (const candidate of candidates) {
      const normalizedTitle = normalizeKeyword(candidate);
      if (!normalizedTitle || normalizedTitle.split(' ').length < 2) {
        continue;
      }

      if (
        normalizedTitle === requested ||
        normalizedTitle.includes(requested) ||
        requested.includes(normalizedTitle)
      ) {
        return {
          exists: true,
          title: candidate.replace(/\s+/g, ' ').trim(),
          normalizedTitle,
        };
      }
    }

    if (candidates.length > 0) {
      const firstTitle = candidates[0].replace(/\s+/g, ' ').trim();
      const normalizedTitle = normalizeKeyword(firstTitle);

      if (normalizedTitle && normalizedTitle.includes(requested)) {
        return {
          exists: true,
          title: firstTitle,
          normalizedTitle,
        };
      }
    }

    return { exists: false };
  }
}
