import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { randomUUID } from 'crypto';
import { normalizeKeyword } from '../../common/utils/normalize-keyword.util';

export type DiscoverGameItem = {
  title: string;
  normalizedTitle: string;
  source: 'roblox_discover';
};

type ExploreSort = {
  id?: string;
  sortId?: string;
  token?: string;
  topicId?: string;
  topicName?: string;
  name?: string;
  title?: string;
};

type ExploreSortsResponse = {
  sorts?: ExploreSort[];
  gameSorts?: ExploreSort[];
  sortsCollection?: ExploreSort[];
};

type ExploreGame = {
  universeId?: number;
  placeId?: number;
  name?: string;
  title?: string;
  displayName?: string;
  gameName?: string;
};

type ExploreContentResponse = {
  games?: ExploreGame[];
  content?: ExploreGame[];
  items?: ExploreGame[];
};

@Injectable()
export class RobloxDiscoverService {
  private readonly logger = new Logger(RobloxDiscoverService.name);
  private readonly sortsUrl = 'https://apis.roblox.com/explore-api/v1/get-sorts';
  private readonly sortContentUrl = 'https://apis.roblox.com/explore-api/v1/get-sort-content';

  async fetchDiscoverGames(): Promise<DiscoverGameItem[]> {
    try {
      const sessionId = randomUUID();
      const sortsResponse = await axios.get<ExploreSortsResponse>(this.sortsUrl, {
        params: {
          sessionId,
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; GameTrendRadar/1.0)',
          Accept: 'application/json',
        },
        timeout: 10000,
      });

      this.logger.log(`Roblox Discover request succeeded: status=${sortsResponse.status}`);
      this.logger.log(
        `Roblox Discover sorts keys=${Object.keys(sortsResponse.data ?? {}).join(',')}`,
      );

      const sorts = this.extractSorts(sortsResponse.data);
      const candidateSorts = sorts.slice(0, 15);
      const rawCandidates: string[] = [];

      for (const sort of candidateSorts) {
        const sortId = this.getSortId(sort);
        if (!sortId) {
          continue;
        }

        try {
          const contentResponse = await axios.get<ExploreContentResponse>(this.sortContentUrl, {
            params: {
              sessionId,
              sortId,
            },
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; GameTrendRadar/1.0)',
              Accept: 'application/json',
            },
            timeout: 10000,
          });
          this.logger.log(
            `Roblox Discover sortContent keys=${Object.keys(contentResponse.data ?? {}).join(',')}`,
          );

          const gameTitles = this.extractGameTitles(contentResponse.data);
          rawCandidates.push(...gameTitles);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'unknown error';
          this.logger.warn(`Failed to fetch Roblox Discover sort content: sortId=${sortId}, ${message}`);
        }
      }

      this.logger.log(`Roblox Discover rawCandidates=${rawCandidates.length}`);

      const deduped = new Map<string, DiscoverGameItem>();
      for (const rawTitle of rawCandidates) {
        this.pushDiscoverCandidate(deduped, rawTitle);
      }

      const discoverGames = [...deduped.values()].slice(0, 200);
      this.logger.log(`Roblox Discover dedupedCandidates=${discoverGames.length}`);
      this.logger.log(`Roblox Discover discoverGames.length=${discoverGames.length}`);
      this.logger.log(`Roblox Discover sample=${JSON.stringify(discoverGames.slice(0, 5))}`);

      return discoverGames;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.warn(`Failed to fetch Roblox Discover games: ${message}`);
      return [];
    }
  }

  private extractSorts(payload: ExploreSortsResponse): ExploreSort[] {
    if (Array.isArray(payload.sorts)) {
      return payload.sorts;
    }

    if (Array.isArray(payload.gameSorts)) {
      return payload.gameSorts;
    }

    if (Array.isArray(payload.sortsCollection)) {
      return payload.sortsCollection;
    }

    return [];
  }

  private getSortId(sort: ExploreSort): string | null {
    return sort.id ?? sort.sortId ?? sort.token ?? sort.topicId ?? null;
  }

  private extractGameTitles(payload: ExploreContentResponse): string[] {
    const items = Array.isArray(payload.games)
      ? payload.games
      : Array.isArray(payload.content)
        ? payload.content
        : Array.isArray(payload.items)
          ? payload.items
          : [];

    return items
      .map((item) => item.name ?? item.title ?? item.displayName ?? item.gameName ?? '')
      .map((title) => title.trim())
      .filter((title) => title.length > 0);
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
