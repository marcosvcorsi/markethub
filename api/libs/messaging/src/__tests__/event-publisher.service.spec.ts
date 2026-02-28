import { Test, TestingModule } from '@nestjs/testing';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { EventPublisherService, MARKETHUB_EXCHANGE } from '../event-publisher.service';

describe('EventPublisherService', () => {
  let service: EventPublisherService;
  let amqpConnection: jest.Mocked<AmqpConnection>;

  beforeEach(async () => {
    const mockAmqp = {
      publish: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventPublisherService,
        { provide: AmqpConnection, useValue: mockAmqp },
      ],
    }).compile();

    service = module.get(EventPublisherService);
    amqpConnection = module.get(AmqpConnection);
  });

  it('should wrap payload in DomainEvent envelope', async () => {
    const payload = { orderId: '123', totalAmount: 100 };

    await service.publish('order.created', payload, 'test-correlation-id');

    expect(amqpConnection.publish).toHaveBeenCalledTimes(1);

    const [exchange, routingKey, event] = amqpConnection.publish.mock.calls[0];
    expect(exchange).toBe(MARKETHUB_EXCHANGE);
    expect(routingKey).toBe('order.created');
    expect(event).toMatchObject({
      eventType: 'order.created',
      correlationId: 'test-correlation-id',
      payload: { orderId: '123', totalAmount: 100 },
    });
    expect(event.eventId).toBeDefined();
    expect(event.timestamp).toBeDefined();
  });

  it('should generate correlationId if not provided', async () => {
    await service.publish('order.created', { orderId: '123' });

    const [, , event] = amqpConnection.publish.mock.calls[0];
    expect(event.correlationId).toBeDefined();
    expect(event.correlationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('should publish to the correct exchange and routing key', async () => {
    await service.publish('payment.completed', { paymentId: '456' });

    expect(amqpConnection.publish).toHaveBeenCalledWith(
      MARKETHUB_EXCHANGE,
      'payment.completed',
      expect.objectContaining({ eventType: 'payment.completed' }),
    );
  });
});
