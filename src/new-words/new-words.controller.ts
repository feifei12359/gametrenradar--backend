import { Controller, Get, Post } from '@nestjs/common';
import { TokenService } from '../services/token.service';

@Controller('new-words')
export class NewWordsController {
  constructor(private readonly tokenService: TokenService) { }

  @Get()
  async getNewWords() {
    return this.tokenService.getNewWords();
  }

  @Post('clear')
  async clearDatabase() {
    await this.tokenService.clearDatabase();
    return {
      message: '数据库已清空',
      timestamp: new Date().toISOString()
    };
  }

  @Post('analyze')
  async analyzeTokens() {
    await this.tokenService.analyzeTokens();
    return {
      message: '新词分析完成',
      timestamp: new Date().toISOString()
    };
  }
}
