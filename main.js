const core = require('@nestjs/core');
const appModule = require('./app.module');

async function bootstrap() {
  const app = await core.NestFactory.create(appModule.AppModule);

  // 允许前端域名访问
  app.enableCors({
    origin: ['https://game-trend-radar-qianduan.vercel.app', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  });

  await app.listen(process.env.PORT || 8080);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
//# sourceMappingURL=main.js.map