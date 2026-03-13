import { Injectable, Logger } from '@nestjs/common';
import { RegionCode } from '@prisma/client';
import axios from 'axios';

type RobloxValidationResult = {
  matched: boolean;
  gameId?: string;
  gameName: string;
  players?: number;
  favorites?: number;
  visits?: number;
  provider: 'roblox-api' | 'mock';
};

interface RobloxValidationProvider {
  validate(keyword: string, region: RegionCode): Promise<RobloxValidationResult>;
}

class MockRobloxValidationProvider implements RobloxValidationProvider {
  async validate(keyword: string): Promise<RobloxValidationResult> {
    const seed = keyword
      .toLowerCase()
      .split('')
      .reduce((sum, char) => sum + char.charCodeAt(0), 0);

    return {
      matched: true,
      gameId: `mock-${seed}`,
      gameName: keyword,
      players: seed % 6000,
      favorites: 1000 + (seed % 40000),
      visits: 5000 + seed * 3,
      provider: 'mock',
    };
  }
}

class RobloxApiValidationProvider implements RobloxValidationProvider {
  async validate(keyword: string): Promise<RobloxValidationResult> {
    const response = await axios.get('https://games.roblox.com/v1/games/list', {
      params: {
        'model.keyword': keyword,
        'model.maxRows': 10,
      },
    });

    const first = response.data?.games?.[0];
    if (!first) {
      return {
        matched: false,
        gameName: keyword,
        provider: 'roblox-api',
      };
    }

    return {
      matched: true,
      gameId: String(first.placeId ?? first.universeId ?? ''),
      gameName: first.name ?? keyword,
      players: Number(first.playerCount ?? first.playing ?? 0),
      favorites: Number(first.favoriteCount ?? 0),
      visits: Number(first.totalUpVotes ?? first.visits ?? 0),
      provider: 'roblox-api',
    };
  }
}

@Injectable()
export class RobloxValidationService {
  private readonly logger = new Logger(RobloxValidationService.name);
  private readonly provider: RobloxValidationProvider;

  constructor() {
    this.provider = process.env.ROBLOX_VALIDATION_MODE === 'live'
      ? new RobloxApiValidationProvider()
      : new MockRobloxValidationProvider();
  }

  async validateKeyword(keyword: string, region: RegionCode) {
    try {
      return await this.provider.validate(keyword, region);
    } catch (error) {
      this.logger.error(
        `Roblox validation failed for ${region}/${keyword}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      const fallback = new MockRobloxValidationProvider();
      return fallback.validate(keyword, region);
    }
  }
}
