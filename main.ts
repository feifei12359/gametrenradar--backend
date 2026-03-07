import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 允许 Vercel 前端访问
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://game-trend-radar-qianduan.vercel.app',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = process.env.PORT || 3000;

  await app.listen(port);

  console.log(`🚀 Application running on port ${port}`);
}

bootstrap();
