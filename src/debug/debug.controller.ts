import { Controller, Get, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

@Controller('debug')
export class DebugController {
  constructor(@Inject(REQUEST) private request: Request) {}

  @Get('routes')
  async getRoutes() {
    try {
      // 从 Express 应用实例获取路由
      const app = this.request.app;
      
      // 检查是否存在 _router 属性（Express 的内部路由实例）
      if (!app._router) {
        return {
          success: false,
          message: '无法获取路由信息：_router 不存在',
          routes: []
        };
      }

      const routes = [];
      
      // 遍历所有路由层
      if (app._router.stack) {
        app._router.stack.forEach((layer: any) => {
          if (layer.route) {
            // 处理路由层
            const path = layer.route.path;
            const methods = Object.keys(layer.route.methods);
            
            methods.forEach((method: string) => {
              routes.push({
                method: method.toUpperCase(),
                path: `/api${path}` // 添加 /api 前缀
              });
            });
          } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
            // 处理中间件路由（如控制器组）
            layer.handle.stack.forEach((subLayer: any) => {
              if (subLayer.route) {
                const path = subLayer.route.path;
                const methods = Object.keys(subLayer.route.methods);
                
                methods.forEach((method: string) => {
                  routes.push({
                    method: method.toUpperCase(),
                    path: `/api${path}` // 添加 /api 前缀
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
    } catch (error) {
      return {
        success: false,
        message: `获取路由失败：${error instanceof Error ? error.message : String(error)}`,
        routes: []
      };
    }
  }
}
