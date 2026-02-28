import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { ProxyService } from '../proxy.service';

describe('ProxyService', () => {
  let service: ProxyService;
  let httpService: { request: jest.Mock };

  beforeEach(async () => {
    httpService = {
      request: jest.fn().mockReturnValue(of({ data: { id: '1' } })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProxyService,
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    service = module.get(ProxyService);
  });

  it('should forward GET request to product-catalog service', async () => {
    const result = await service.forward('products', 'GET', '/products');

    expect(httpService.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: expect.stringContaining('/products'),
      }),
    );
    expect(result).toEqual({ id: '1' });
  });

  it('should forward POST request with data and headers', async () => {
    await service.forward('orders', 'POST', '/orders', {
      data: { items: [] },
      headers: { authorization: 'Bearer token' },
    });

    expect(httpService.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        data: { items: [] },
        headers: { authorization: 'Bearer token' },
      }),
    );
  });

  it('should throw for unknown service', async () => {
    await expect(
      service.forward('unknown', 'GET', '/test'),
    ).rejects.toThrow('Unknown service: unknown');
  });
});
