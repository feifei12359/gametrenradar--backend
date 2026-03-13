import { Injectable, Logger } from '@nestjs/common';
import { RegionCode } from '@prisma/client';

type TrendsValidationResult = {
  score: number;
  sourceWindow: string;
  provider: 'mock';
};

@Injectable()
export class TrendsValidationService {
  private readonly logger = new Logger(TrendsValidationService.name);

  async validateKeyword(keyword: string, region: RegionCode): Promise<TrendsValidationResult | null> {
    try {
      const base = keyword
        .toLowerCase()
        .split('')
        .reduce((sum, char) => sum + char.charCodeAt(0), 0);

      const regionBias = region.charCodeAt(0) % 7;
      const score = Math.max(8, Math.min(100, (base % 65) + 20 + regionBias));

      return {
        score,
        sourceWindow: '12m',
        provider: 'mock',
      };
    } catch (error) {
      this.logger.error(
        `Trends validation failed for ${region}/${keyword}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }
}
