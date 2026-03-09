import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*', // 先全部允许
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: 'Content-Type',
  });

  await app.listen(8080);

  console.log('🚀 Server running on port 8080');
}
bootstrap();
