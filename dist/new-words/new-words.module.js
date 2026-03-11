"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewWordsModule = void 0;
const common_1 = require("@nestjs/common");
const new_words_controller_1 = require("./new-words.controller");
const token_service_1 = require("../services/token.service");
const youtube_service_1 = require("../youtube/youtube.service");
const prisma_module_1 = require("../prisma/prisma.module");
let NewWordsModule = class NewWordsModule {
};
exports.NewWordsModule = NewWordsModule;
exports.NewWordsModule = NewWordsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [new_words_controller_1.NewWordsController],
        providers: [token_service_1.TokenService, youtube_service_1.YoutubeService]
    })
], NewWordsModule);
