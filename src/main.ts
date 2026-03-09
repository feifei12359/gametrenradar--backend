import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局 API 前缀
  app.setGlobalPrefix('api');

  // CORS 配置
  app.enableCors({
    origin: [
      ' `https://game-trend-radar-qianduan.vercel.app` ',
      'http://localhost:3000'
    ],
    methods: 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    credentials: true
  });

  const port = process.env.PORT || 8080;
  await app.listen(port);

  console.log(`🚀 Server running on port ${port}`);
}

bootstrap();
