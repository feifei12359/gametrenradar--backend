import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);

  async crawlSteam(): Promise<string[]> {
    try {
      this.logger.log('开始抓取 Steam 新游戏');
      const url = 'https://store.steampowered.com/search/?sort_by=Released_DESC';
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
      const keywords: string[] = [];

      $('.search_result_row').each((index, element) => {
        const title = $(element).find('.title').text().trim();
        const tags = $(element).find('.top_tag').text().trim();
        const description = $(element).find('.search_reviewscore').text().trim();
        
        if (title) {
          keywords.push(...this.extractKeywords(title));
        }
        if (tags) {
          keywords.push(...this.extractKeywords(tags));
        }
        if (description) {
          keywords.push(...this.extractKeywords(description));
        }
      });

      return [...new Set(keywords)].filter(keyword => keyword.length > 2);
    } catch (error) {
      this.logger.error('Steam 抓取失败:', error);
      return [];
    }
  }

  async crawlRoblox(): Promise<string[]> {
    try {
      this.logger.log('开始抓取 Roblox 热门游戏');
      const url = 'https://www.roblox.com/discover';
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
      const keywords: string[] = [];

      $('.game-card').each((index, element) => {
        const title = $(element).find('.game-card-name').text().trim();
        if (title) {
          keywords.push(...this.extractKeywords(title));
        }
      });

      return [...new Set(keywords)].filter(keyword => keyword.length > 2);
    } catch (error) {
      this.logger.error('Roblox 抓取失败:', error);
      return [];
    }
  }

  async crawlReddit(): Promise<string[]> {
    try {
      this.logger.log('开始抓取 Reddit 游戏讨论');
      const subreddits = ['gamedev', 'indiegames', 'roblox'];
      const keywords: string[] = [];

      for (const subreddit of subreddits) {
        const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=50`;
        try {
          const response = await axios.get(url, {
            headers: {
              'User-Agent': 'Game Trend Radar Bot'
            }
          });

          if (response.data.data.children) {
            response.data.data.children.forEach((post: any) => {
              const title = post.data.title;
              if (title) {
                keywords.push(...this.extractKeywords(title));
              }
            });
          }
        } catch (subError) {
          this.logger.error(`Reddit ${subreddit} 抓取失败:`, subError);
        }
      }

      return [...new Set(keywords)].filter(keyword => keyword.length > 2);
    } catch (error) {
      this.logger.error('Reddit 抓取失败:', error);
      return [];
    }
  }

  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !this.isStopWord(word));
  }

  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must'
    ]);
    return stopWords.has(word);
  }

  async crawlAllPlatforms(): Promise<string[]> {
    const [steamKeywords, robloxKeywords, redditKeywords] = await Promise.all([
      this.crawlSteam(),
      this.crawlRoblox(),
      this.crawlReddit()
    ]);

    return [...new Set([...steamKeywords, ...robloxKeywords, ...redditKeywords])];
  }
}
