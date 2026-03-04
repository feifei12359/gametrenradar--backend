"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YoutubeModule = void 0;
const common_1 = require("@nestjs/common");
const youtube_service_1 = require("./youtube.service");
const youtube_controller_1 = require("./youtube.controller");
const game_module_1 = require("../game/game.module");
let YoutubeModule = class YoutubeModule {
};
exports.YoutubeModule = YoutubeModule;
exports.YoutubeModule = YoutubeModule = __decorate([
    (0, common_1.Module)({
        imports: [game_module_1.GameModule],
        providers: [youtube_service_1.YoutubeService],
        controllers: [youtube_controller_1.YoutubeController],
        exports: [youtube_service_1.YoutubeService],
    })
], YoutubeModule);
