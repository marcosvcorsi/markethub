import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '@markethub/auth';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationController {
  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Health check for notification service' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  health() {
    return { status: 'ok', service: 'notification' };
  }
}
