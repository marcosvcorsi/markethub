import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { CorrelationIdMiddleware, CORRELATION_ID_HEADER } from './correlation-id.middleware';

@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
        customProps: (req: any) => ({
          correlationId: req[CORRELATION_ID_HEADER],
        }),
        autoLogging: true,
        serializers: {
          req: (req) => ({
            method: req.method,
            url: req.url,
          }),
          res: (res) => ({
            statusCode: res.statusCode,
          }),
        },
      },
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
