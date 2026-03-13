import { Body, Controller, Get, Post } from '@nestjs/common';
import { ResponseMessage } from '../common/utils/response-message.decorator';
import { AnalyzeNewWordsDto } from './dto/analyze-new-words.dto';
import { NewWordsService } from './new-words.service';

@Controller('new-words')
export class NewWordsController {
  constructor(private readonly newWordsService: NewWordsService) {}

  @Get()
  @ResponseMessage('new words fetched')
  getAll() {
    return this.newWordsService.getAll();
  }

  @Post('analyze')
  @ResponseMessage('new words analyzed')
  analyze(@Body() dto: AnalyzeNewWordsDto) {
    return this.newWordsService.analyze(dto);
  }

  @Post('reset')
  @ResponseMessage('new words reset')
  reset() {
    return this.newWordsService.reset();
  }

  @Post('clear')
  @ResponseMessage('new words cleared')
  clear() {
    return this.newWordsService.clear();
  }
}
