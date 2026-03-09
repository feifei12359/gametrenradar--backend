import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // API 前缀
  app.setGlobalPrefix('api');

  // ⭐ 先全部允许跨域（调试用）
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  const port = process.env.PORT || 8080;

  await app.listen(port);

  console.log(`🚀 Server running on port ${port}`);
}

bootstrap();
