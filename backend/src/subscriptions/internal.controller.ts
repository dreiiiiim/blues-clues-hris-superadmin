import {
  Controller,
  Patch,
  Param,
  Body,
  Headers,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SubscriptionsService } from './subscriptions.service';

@Controller('internal')
export class InternalController {
  private readonly logger = new Logger(InternalController.name);

  constructor(
    private readonly service: SubscriptionsService,
    private readonly config: ConfigService,
  ) {}

  private checkSecret(secret: string | undefined) {
    const expected = this.config.get<string>('INTERNAL_API_SECRET');
    if (!expected || secret !== expected) {
      throw new UnauthorizedException('Invalid or missing internal secret');
    }
  }

  @Patch('instances/:instance_id/activate')
  activate(
    @Param('instance_id') instanceId: string,
    @Headers('x-internal-secret') secret: string,
  ) {
    this.checkSecret(secret);
    this.logger.log(`Activating instance ${instanceId}`);
    return this.service.markActive(instanceId);
  }

  @Patch('instances/:instance_id/fail')
  fail(
    @Param('instance_id') instanceId: string,
    @Headers('x-internal-secret') secret: string,
    @Body() body: { error?: string },
  ) {
    this.checkSecret(secret);
    this.logger.warn(`Marking instance ${instanceId} failed: ${body.error}`);
    return this.service.markFailed(instanceId, body.error ?? 'GHA job failed');
  }
}
