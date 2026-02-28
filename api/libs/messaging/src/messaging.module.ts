import { DynamicModule, Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { EventPublisherService, MARKETHUB_EXCHANGE } from './event-publisher.service';

export interface MessagingModuleOptions {
  uri?: string;
}

@Module({})
export class MessagingModule {
  static forRoot(options?: MessagingModuleOptions): DynamicModule {
    const uri = options?.uri || process.env.RABBITMQ_URI || 'amqp://markethub:markethub@localhost:5672';

    return {
      module: MessagingModule,
      imports: [
        RabbitMQModule.forRoot({
          uri,
          exchanges: [
            {
              name: MARKETHUB_EXCHANGE,
              type: 'topic',
              options: { durable: true },
            },
          ],
          connectionInitOptions: { wait: true, timeout: 10000 },
          enableControllerDiscovery: true,
        }),
      ],
      providers: [EventPublisherService],
      exports: [EventPublisherService, RabbitMQModule],
      global: true,
    };
  }
}
