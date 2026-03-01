import {
  All,
  Controller,
  Get,
  Param,
  Req,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Public } from '@markethub/auth';
import { ProxyService } from './proxy.service';

@Controller()
@ApiExcludeController()
export class GatewayController {
  constructor(private readonly proxyService: ProxyService) {}

  @Get('health')
  @Public()
  health() {
    return {
      status: 'ok',
      service: 'gateway',
      timestamp: new Date().toISOString(),
    };
  }

  @All(':service/*path')
  @Public()
  async proxy(
    @Param('service') service: string,
    @Param('path') path: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const forwardHeaders: Record<string, string> = {};
      if (req.headers.authorization) {
        forwardHeaders['authorization'] = req.headers.authorization as string;
      }
      if (req.headers['content-type']) {
        forwardHeaders['content-type'] = req.headers['content-type'] as string;
      }

      const result = await this.proxyService.forward(
        service,
        req.method,
        `/${path}`,
        {
          data: req.body,
          headers: forwardHeaders,
          params: req.query as Record<string, any>,
        },
      );

      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      const status = error.response?.status || HttpStatus.BAD_GATEWAY;
      const data = error.response?.data || {
        statusCode: status,
        message: `Service "${service}" unavailable`,
      };
      res.status(status).json(data);
    }
  }

  // Handle /products and /products/:id routes
  @All('products')
  @Public()
  async productsList(@Req() req: Request, @Res() res: Response) {
    return this.proxyToService('products', '/products', req, res);
  }

  @All('products/:id')
  @Public()
  async productsById(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.proxyToService('products', `/products/${id}`, req, res);
  }

  private async proxyToService(
    service: string,
    path: string,
    req: Request,
    res: Response,
  ) {
    try {
      const forwardHeaders: Record<string, string> = {};
      if (req.headers.authorization) {
        forwardHeaders['authorization'] = req.headers.authorization as string;
      }
      if (req.headers['content-type']) {
        forwardHeaders['content-type'] = req.headers['content-type'] as string;
      }

      const result = await this.proxyService.forward(
        service,
        req.method,
        path,
        {
          data: req.body,
          headers: forwardHeaders,
          params: req.query as Record<string, any>,
        },
      );

      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      const status = error.response?.status || HttpStatus.BAD_GATEWAY;
      const data = error.response?.data || {
        statusCode: status,
        message: `Service "${service}" unavailable`,
      };
      res.status(status).json(data);
    }
  }
}
