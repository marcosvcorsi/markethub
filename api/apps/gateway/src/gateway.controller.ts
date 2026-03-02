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

  // Handle /products and /products/:id routes (must come before :service/*path)
  @All('products/:id')
  @Public()
  async productsById(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.proxyToService('products', `/products/${id}`, req, res);
  }

  @All('products')
  @Public()
  async productsList(@Req() req: Request, @Res() res: Response) {
    return this.proxyToService('products', '/products', req, res);
  }

  // Handle /orders routes
  @All('orders')
  @Public()
  async orders(@Req() req: Request, @Res() res: Response) {
    return this.proxyToService('orders', '/orders', req, res);
  }

  @All('orders/:id')
  @Public()
  async ordersById(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.proxyToService('orders', `/orders/${id}`, req, res);
  }

  @All('orders/:id/cancel')
  @Public()
  async ordersCancel(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.proxyToService('orders', `/orders/${id}/cancel`, req, res);
  }

  // Handle /payments routes
  @All('payments/checkout')
  @Public()
  async paymentsCheckout(@Req() req: Request, @Res() res: Response) {
    return this.proxyToService('payments', '/payments/checkout', req, res);
  }

  @All('payments/order/:orderId')
  @Public()
  async paymentsByOrderId(
    @Param('orderId') orderId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.proxyToService('payments', `/payments/order/${orderId}`, req, res);
  }

  @All('payments/webhook')
  @Public()
  async paymentsWebhook(@Req() req: Request, @Res() res: Response) {
    return this.proxyToService('payments', '/payments/webhook', req, res);
  }

  // Generic service proxy (catches unmatched routes)
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
