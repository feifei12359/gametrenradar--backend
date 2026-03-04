import { Injectable } from '@nestjs/common'

@Injectable()
export class ScoringService {
  calculateNewWordScore(game: any, trendData: any, youtubeData: any): number {
    let trendScore = 0
    let youtubeScore = 0

    if (trendData) {
      trendScore = trendData.maxValue || 0
    }

    if (youtubeData) {
      youtubeScore = youtubeData.videoCount || 0
    }

    return Math.round((trendScore + youtubeScore) / 2)
  }

  determineCandidate(score: number) {
    return {
      isCandidate: score >= 30
    }
  }
}
