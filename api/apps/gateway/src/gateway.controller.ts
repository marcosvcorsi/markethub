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
import { Request, Response } from 'express';
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
}
