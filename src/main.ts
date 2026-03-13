import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

console.log('APP_BUILD_MARK=2026-03-13-railway-check-2');

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

  const port = process.env.PORT || 3000;
  const host = '0.0.0.0';

  await app.listen(port, host);

  console.log(`🚀 Server running on http://${host}:${port}`);
}

bootstrap();
