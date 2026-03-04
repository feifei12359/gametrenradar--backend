import { Controller, Get } from '@nestjs/common';

@Controller('trend')
export class TrendController {

  @Get('exploding')
  getExploding() {
    return [
      { keyword: 'AI Game', score: 95 },
      { keyword: 'Space Sandbox', score: 88 },
      { keyword: 'Idle Strategy', score: 82 }
    ];
  }

}
