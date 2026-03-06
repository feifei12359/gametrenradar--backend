import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ 允许前端跨域请求
  app.enableCors({
    origin: [
      'https://game-trend-radar-qianduan.vercel.app', // 你的前端域名
      'http://localhost:3000' // 本地测试
    ],
    methods: ['GET','POST'],
    credentials: true,
  });

  await app.listen(process.env.PORT || 8080);
}
bootstrap();
