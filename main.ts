import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 设置全局前缀 api
  app.setGlobalPrefix('api');

  // 开启 CORS，仅允许前端域名
  app.enableCors({
    origin: ["https://game-trend-radar-qianduan.vercel.app"],
    credentials: true,
  });

  const port = process.env.PORT || 8080;
  await app.listen(port);
  console.log(`🚀 Server running on port ${port}`);
}

bootstrap();
