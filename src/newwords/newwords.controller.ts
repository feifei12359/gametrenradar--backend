import { Controller, Get } from '@nestjs/common';

@Controller('new-words')
export class NewWordsController {

  @Get()
  getNewWords() {
    return [
      { keyword: "Roblox Simulator", score: 80 },
      { keyword: "AI Sandbox Game", score: 75 },
      { keyword: "Idle Survival", score: 70 }
    ];
  }

}
