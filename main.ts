import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'https://game-trend-radar-qianduan.vercel.app', // 你的前端
      'http://localhost:3000', // 本地调试
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  });

  await app.listen(process.env.PORT || 8080);
}
bootstrap();
