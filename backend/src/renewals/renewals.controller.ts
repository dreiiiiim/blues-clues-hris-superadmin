import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards, Req } from '@nestjs/common';
import { IsIn } from 'class-validator';
import { SuperAdminGuard } from '../auth/super-admin.guard';
import { RenewalsService } from './renewals.service';

class MarkRenewedDto {
  @IsIn(['monthly', 'annual'])
  billing_cycle: 'monthly' | 'annual';
}

@Controller('renewals')
@UseGuards(SuperAdminGuard)
export class RenewalsController {
  constructor(private readonly service: RenewalsService) {}

  @Get()
  list(@Query('status') status?: string) { return this.service.list(status); }

  @Post(':registration_id/remind')
  remind(@Param('registration_id') id: string, @Req() req: any) {
    return this.service.sendReminder(id, req.user.sub);
  }

  @Patch(':registration_id/mark-renewed')
  markRenewed(@Param('registration_id') id: string, @Body() dto: MarkRenewedDto, @Req() req: any) {
    return this.service.markRenewed(id, dto.billing_cycle, req.user.sub);
  }

  @Patch(':registration_id/suspend')
  suspend(@Param('registration_id') id: string, @Req() req: any) {
    return this.service.suspend(id, req.user.sub);
  }
}
