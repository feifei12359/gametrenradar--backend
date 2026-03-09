import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // API 前缀
  app.setGlobalPrefix('api');

  // 完全开放 CORS（开发阶段推荐）
  app.enableCors({
    origin: '*',
    methods: '*',
    allowedHeaders: '*',
  });

  const port = process.env.PORT || 8080;

  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Server running on port ${port}`);
}

bootstrap();
