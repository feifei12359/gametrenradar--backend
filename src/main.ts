import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // API 前缀
  app.setGlobalPrefix('api');

  // ⭐允许所有跨域（先测试）
  app.enableCors({
    origin: true,
    credentials: true,
  });

  const port = process.env.PORT || 8080;

  await app.listen(port);

  console.log(`🚀 Server running on port ${port}`);
}

bootstrap();
