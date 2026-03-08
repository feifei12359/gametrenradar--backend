import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 设置全局前缀
  app.setGlobalPrefix('api');

  app.enableCors({
    origin: [
      "https://game-trend-radar-qianduan.vercel.app",
      "http://localhost:3000"
    ],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true
  });

  const port = process.env.PORT || 8080;

  await app.listen(port);

  console.log(`🚀 Server running on port ${port}`);
}

bootstrap();
