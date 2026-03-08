"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api');
    app.enableCors({
        origin: ['https://game-trend-radar-qianduan.vercel.app'],
        credentials: true,
    });
    const port = process.env.PORT || 8080;
    await app.listen(port);
    console.log(`🚀 Server running on port ${port}`);
}
bootstrap();
