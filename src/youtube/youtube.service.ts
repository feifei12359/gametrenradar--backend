import { Injectable } from '@nestjs/common'

@Injectable()
export class YoutubeService {
  async getYoutubeScore(gameName: string) {
    // 模拟 YouTube 数据
    return {
      videoCount: Math.floor(Math.random() * 200),
      apiAvailable: true
    }
  }
}
