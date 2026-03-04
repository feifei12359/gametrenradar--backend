import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GameService {
  constructor(private readonly prisma: PrismaService) { }

  async createGame(data: { name: string }) {
    return this.prisma.game.create({ data });
  }

  async getAllGames() {
    return this.prisma.game.findMany();
  }

  async deleteGame(id: number) {
    return this.prisma.game.delete({ where: { id } });
  }
}
