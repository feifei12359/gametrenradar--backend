"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrendsModule = void 0;
const common_1 = require("@nestjs/common");
const trends_service_1 = require("./trends.service");
const trends_controller_1 = require("./trends.controller");
const game_module_1 = require("../game/game.module");
let TrendsModule = class TrendsModule {
};
exports.TrendsModule = TrendsModule;
exports.TrendsModule = TrendsModule = __decorate([
    (0, common_1.Module)({
        imports: [game_module_1.GameModule],
        providers: [trends_service_1.TrendsService],
        controllers: [trends_controller_1.TrendsController],
        exports: [trends_service_1.TrendsService],
    })
], TrendsModule);
