import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 设置全局 API 前缀
  app.setGlobalPrefix('api');

  // ✅ 正确配置 CORS
  app.enableCors({
    origin: [
      ' `https://game-trend-radar-qianduan.vercel.app` ', // Vercel 前端
      'http://localhost:3000',                        // 本地开发
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = process.env.PORT || 8080;
  await app.listen(port);
  console.log(`🚀 Server running on port ${port}`);
}

bootstrap();
