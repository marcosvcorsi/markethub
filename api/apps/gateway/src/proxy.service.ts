import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig } from 'axios';
import { firstValueFrom } from 'rxjs';

export interface ServiceConfig {
  name: string;
  url: string;
}

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  private readonly services: Record<string, string> = {
    products: process.env.PRODUCT_CATALOG_URL || 'http://localhost:3001',
    orders: process.env.ORDER_SERVICE_URL || 'http://localhost:3002',
    payments: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3003',
    notifications: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004',
  };

  constructor(private readonly httpService: HttpService) {}

  async forward(
    service: string,
    method: string,
    path: string,
    options?: {
      data?: any;
      headers?: Record<string, string>;
      params?: Record<string, any>;
    },
  ): Promise<any> {
    const baseUrl = this.services[service];
    if (!baseUrl) {
      throw new Error(`Unknown service: ${service}`);
    }

    const url = `${baseUrl}${path}`;
    const config: AxiosRequestConfig = {
      method: method as any,
      url,
      data: options?.data,
      headers: options?.headers,
      params: options?.params,
    };

    this.logger.debug(`Proxying ${method.toUpperCase()} ${url}`);

    const response = await firstValueFrom(
      this.httpService.request(config),
    );

    return response.data;
  }
}
