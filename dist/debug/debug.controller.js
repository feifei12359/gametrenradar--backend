"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebugController = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const express_1 = require("express");
let DebugController = class DebugController {
    constructor(request) {
        this.request = request;
    }
    async getRoutes() {
        try {
            const app = this.request.app;
            if (!app._router) {
                return {
                    success: false,
                    message: '无法获取路由信息：_router 不存在',
                    routes: []
                };
            }
            const routes = [];
            if (app._router.stack) {
                app._router.stack.forEach((layer) => {
                    if (layer.route) {
                        const path = layer.route.path;
                        const methods = Object.keys(layer.route.methods);
                        methods.forEach((method) => {
                            routes.push({
                                method: method.toUpperCase(),
                                path: `/api${path}`
                            });
                        });
                    }
                    else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
                        layer.handle.stack.forEach((subLayer) => {
                            if (subLayer.route) {
                                const path = subLayer.route.path;
                                const methods = Object.keys(subLayer.route.methods);
                                methods.forEach((method) => {
                                    routes.push({
                                        method: method.toUpperCase(),
                                        path: `/api${path}`
                                    });
                                });
                            }
                        });
                    }
                });
            }
            return {
                success: true,
                message: `获取到 ${routes.length} 条路由`,
                routes
            };
        }
        catch (error) {
            return {
                success: false,
                message: `获取路由失败：${error instanceof Error ? error.message : String(error)}`,
                routes: []
            };
        }
    }
};
exports.DebugController = DebugController;
__decorate([
    (0, common_1.Get)('routes'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DebugController.prototype, "getRoutes", null);
exports.DebugController = DebugController = __decorate([
    (0, common_1.Controller)('debug'),
    __param(0, (0, common_1.Inject)(core_1.REQUEST)),
    __metadata("design:paramtypes", [typeof (_a = typeof express_1.Request !== "undefined" && express_1.Request) === "function" ? _a : Object])
], DebugController);
