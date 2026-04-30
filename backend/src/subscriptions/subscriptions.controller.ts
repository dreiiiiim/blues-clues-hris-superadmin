import { Controller, Get, Patch, Param, Query, Body, UseGuards, Req } from '@nestjs/common';
import { SuperAdminGuard } from '../auth/super-admin.guard';
import { SubscriptionsService } from './subscriptions.service';
import { UpdateSubscriptionStatusDto } from './dto/update-subscription-status.dto';

@Controller('subscriptions')
@UseGuards(SuperAdminGuard)
export class SubscriptionsController {
  constructor(private readonly service: SubscriptionsService) {}

  @Get()
  list(@Query() query: Record<string, any>) {
    return this.service.list({
      status: query.status, billing_cycle: query.billing_cycle,
      page: query.page ? +query.page : 1, limit: query.limit ? +query.limit : 20,
    });
  }

  @Get(':registration_id')
  detail(@Param('registration_id') id: string) { return this.service.detail(id); }

  @Patch(':registration_id/status')
  updateStatus(@Param('registration_id') id: string, @Body() dto: UpdateSubscriptionStatusDto, @Req() req: any) {
    return this.service.updateStatus(id, dto.subscription_status, req.user.sub);
  }

  @Get(':registration_id/payment-history')
  paymentHistory(@Param('registration_id') id: string) { return this.service.paymentHistory(id); }
}
