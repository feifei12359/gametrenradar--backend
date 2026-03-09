import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: [
      ' `https://game-trend-radar-qianduan.vercel.app` ',
      'http://localhost:3000',
    ],
    methods: 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    credentials: true,
  });

  await app.listen(process.env.PORT || 8080);

  console.log('🚀 Server running');
}
bootstrap();
