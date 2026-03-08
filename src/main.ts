import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局前缀 api
  app.setGlobalPrefix('api');

  // 允许前端跨域
  app.enableCors({
    origin: ["https://game-trend-radar-qianduan.vercel.app"],
    credentials: true,
  });

  const port = process.env.PORT || 8080;
  await app.listen(port);
  console.log(`🚀 Server running on port ${port}`);
}

bootstrap();
