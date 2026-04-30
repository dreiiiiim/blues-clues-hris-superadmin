import { Controller, Get, UseGuards } from '@nestjs/common';
import { SuperAdminGuard } from '../auth/super-admin.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(SuperAdminGuard)
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('stats')
  stats() { return this.service.getStats(); }

  @Get('pending-approvals')
  pendingApprovals() { return this.service.getPendingApprovals(); }
}
