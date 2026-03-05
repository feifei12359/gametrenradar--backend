import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // 创建测试游戏
  await prisma.game.createMany({
    data: [
      { id: 1, name: 'Test Game 1', platform: 'steam' },
      { id: 2, name: 'Test Game 2', platform: 'roblox' },
    ],
  });

  // 创建示例趋势数据
  await prisma.trend.createMany({
    data: [
      {
        id: 1,
        word: 'Space Shooter',
        prediction: 85,
        growthRate: 0.8,
        acceleration: 0.5,
        platformScore: 70,
        aiScore: 90,
        firstSeenAt: new Date(),
        platforms: ['Steam', 'Roblox']
      },
      {
        id: 2,
        word: 'Puzzle Master',
        prediction: 78,
        growthRate: 0.6,
        acceleration: 0.3,
        platformScore: 60,
        aiScore: 80,
        firstSeenAt: new Date(),
        platforms: ['Steam']
      }
    ]
  });

  console.log('✅ Seed finished.');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
