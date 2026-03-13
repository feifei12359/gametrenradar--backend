import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SystemService {
  constructor(private readonly prisma: PrismaService) {}

  async reset(): Promise<{
    trendsDeleted: number;
    newWordsDeleted: number;
    jobsDeleted: number;
  }> {
    const [trends, newWords, jobs] = await this.prisma.$transaction([
      this.prisma.trend.deleteMany(),
      this.prisma.newWord.deleteMany(),
      this.prisma.jobRun.deleteMany(),
    ]);

    return {
      trendsDeleted: trends.count,
      newWordsDeleted: newWords.count,
      jobsDeleted: jobs.count,
    };
  }
}
