import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {

  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: [
      " `https://game-trend-radar-qianduan.vercel.app` ",
      "http://localhost:3000",
      "http://localhost:5173"
    ],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: "Content-Type, Accept",
    credentials: true
  });

  const port = process.env.PORT || 8080;

  await app.listen(port);

  console.log(`🚀 Server running on port ${port}`);

}

bootstrap();
