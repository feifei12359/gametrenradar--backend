console.log('========================================');
console.log('=== STARTING FROM ROOT MAIN.JS ===');
console.log('========================================');
console.log('Environment variables:');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('========================================');

// main.js - Root entry point with port configuration
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');

async function bootstrap() {
  console.log('Bootstrapping application...');
  
  const app = await NestFactory.create(AppModule);

  // 允许跨域（前端 Vercel 访问）
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // 强制使用端口 3000，避免使用数据库端口
  const port = 3000;
  console.log('Using port:', port);
  console.log('Ignoring PORT environment variable:', process.env.PORT);
  
  const http = app.getHttpAdapter().getInstance();
  
  // 健康检查端点
  http.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });
  
  console.log('About to listen on port:', port, '0.0.0.0');
  await app.listen(port, '0.0.0.0');

  console.log('==============================');
  console.log('🚀 Server started successfully');
  console.log('Listening on port:', port);
  console.log('Environment PORT:', process.env.PORT);
  console.log('==============================');
}

bootstrap().catch(err => {
  console.error('Error bootstrapping:', err);
  process.exit(1);
});
