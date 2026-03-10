import './polyfill'; // Load polyfills for Node.js 18
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局 API 前缀
  app.setGlobalPrefix('api');

  // CORS 配置
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept',
    credentials: true
  });

  const port = process.env.PORT || 8080;
  await app.listen(port);

  console.log(`🚀 Server running on port ${port}`);
}

bootstrap();
