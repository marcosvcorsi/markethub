import { DomainEvent } from '@markethub/common';

export class MockEventPublisher {
  readonly events: Array<{ eventType: string; payload: unknown }> = [];

  async publish<T>(
    eventType: string,
    payload: T,
    _correlationId?: string,
  ): Promise<void> {
    this.events.push({ eventType, payload });
  }

  findByType(eventType: string) {
    return this.events.filter((e) => e.eventType === eventType);
  }

  clear() {
    this.events.length = 0;
  }
}
