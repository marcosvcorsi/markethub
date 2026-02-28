import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { DomainEvent } from '@markethub/common';

export const MARKETHUB_EXCHANGE = 'markethub.events';

@Injectable()
export class EventPublisherService {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  async publish<T>(
    eventType: string,
    payload: T,
    correlationId?: string,
  ): Promise<void> {
    const event: DomainEvent<T> = {
      eventId: randomUUID(),
      eventType,
      timestamp: new Date().toISOString(),
      correlationId: correlationId || randomUUID(),
      payload,
    };

    await this.amqpConnection.publish(MARKETHUB_EXCHANGE, eventType, event);
  }
}
