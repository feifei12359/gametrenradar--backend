import { Injectable } from '@nestjs/common';

@Injectable()
export class TrendService {

  getExploding() {
    return [
      { keyword: "Test Game 1", score: 95 },
      { keyword: "Test Game 2", score: 88 }
    ];
  }

  getEarly() {
    return [
      { keyword: "Early Game 1", score: 60 }
    ];
  }

  getAll() {
    return [
      { keyword: "Game A", score: 95 },
      { keyword: "Game B", score: 80 }
    ];
  }

}