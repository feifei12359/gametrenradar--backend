const core = require('@nestjs/core');
const appModule = require('./app.module');

async function bootstrap() {
  const app = await core.NestFactory.create(appModule.AppModule);

  app.enableCors({
    origin: [
      'https://game-trend-radar-qianduan.vercel.app', // 允许前端
      'http://localhost:3000', // 本地开发允许
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  });

  await app.listen(process.env.PORT || 8080);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
//# sourceMappingURL=main.js.map