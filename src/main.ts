import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 允许 Vercel 前端跨域访问
  app.enableCors({
    origin: ["https://game-trend-radar-qianduan.vercel.app"],
    credentials: true,
  });

  const port = process.env.PORT || 8080;
  await app.listen(port);
  console.log(`🚀 Application running on port ${port}`);
}

bootstrap();
