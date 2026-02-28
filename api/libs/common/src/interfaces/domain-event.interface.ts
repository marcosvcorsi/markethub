export interface DomainEvent<T = unknown> {
  eventId: string;
  eventType: string;
  timestamp: string;
  correlationId: string;
  payload: T;
}
