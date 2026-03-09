import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 允许跨域访问
  app.enableCors({
    origin: [
      ' `https://game-trend-radar-qianduan.vercel.app` ', // 生产前端
      'http://localhost:3000',                        // 本地调试
    ],
    methods: 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    credentials: true,
  });

  const port = process.env.PORT || 8080;
  await app.listen(port);
  console.log(`🚀 Server running on port ${port}`);
}
bootstrap();
