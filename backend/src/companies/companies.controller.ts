import { Controller, Get, Patch, Post, Param, Query, Body, UseGuards, Req } from '@nestjs/common';
import { SuperAdminGuard } from '../auth/super-admin.guard';
import { CompaniesService } from './companies.service';
import { UpdateCompanyStatusDto } from './dto/update-company-status.dto';

@Controller('companies')
@UseGuards(SuperAdminGuard)
export class CompaniesController {
  constructor(private readonly service: CompaniesService) {}

  @Get()
  list(@Query() query: Record<string, any>) {
    return this.service.list({
      status: query.status, plan: query.plan, industry: query.industry,
      from: query.from, to: query.to,
      page: query.page ? +query.page : 1,
      limit: query.limit ? +query.limit : 20,
    });
  }

  @Get(':company_id')
  detail(@Param('company_id') id: string) {
    return this.service.detail(id);
  }

  @Patch(':registration_id/status')
  updateStatus(
    @Param('registration_id') id: string,
    @Body() dto: UpdateCompanyStatusDto,
    @Req() req: any,
  ) {
    return this.service.updateStatus(id, dto.subscription_status, req.user.sub);
  }

  @Post(':registration_id/provision')
  provision(@Param('registration_id') id: string, @Req() req: any) {
    return this.service.provision(id, req.user.sub);
  }
}
