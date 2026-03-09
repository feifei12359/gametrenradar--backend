import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ 允许跨域
  app.enableCors({
    origin: [
      ' `https://game-trend-radar-qianduan.vercel.app` ',
      'http://localhost:3000',
    ],
    methods: 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    credentials: true,
  });

  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT || 8080);
  console.log('🚀 Server running on port 8080');
}

bootstrap();
