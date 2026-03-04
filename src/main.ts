import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // 正确允许 Vercel 前端域名
  app.enableCors({
    origin: [
      "https://game-trend-radar-qianduan.vercel.app"
    ],
    credentials: true,
  })

  const port = process.env.PORT || 3000

  await app.listen(port)

  console.log(`🚀 Application running on port ${port}`)
}

bootstrap()
