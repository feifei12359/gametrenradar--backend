import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // 开启 CORS，允许前端跨域访问
  app.enableCors({
    origin: "*",
  })

  const port = process.env.PORT || 3000

  await app.listen(port)

  console.log(`🚀 Application running on port ${port}`)
}

bootstrap()
