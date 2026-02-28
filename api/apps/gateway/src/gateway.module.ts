import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '@markethub/auth';
import { LoggerModule } from '@markethub/logger';
import { GatewayController } from './gateway.controller';
import { ProxyService } from './proxy.service';

@Module({
  imports: [
    HttpModule.register({ timeout: 10000 }),
    AuthModule,
    LoggerModule,
  ],
  controllers: [GatewayController],
  providers: [ProxyService],
})
export class GatewayModule {}
