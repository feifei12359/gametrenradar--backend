import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const [explodingCount, earlyCount, totalTrends, totalNewWords] =
      await this.prisma.$transaction([
        this.prisma.trend.count({ where: { stage: 'exploding' } }),
        this.prisma.trend.count({ where: { stage: 'early' } }),
        this.prisma.trend.count(),
        this.prisma.newWord.count(),
      ]);

    return {
      explodingCount,
      earlyCount,
      totalTrends,
      totalNewWords,
    };
  }
}
