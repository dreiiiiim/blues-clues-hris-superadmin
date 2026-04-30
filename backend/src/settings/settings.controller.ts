import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { IsBoolean, IsString, IsOptional } from 'class-validator';
import { SuperAdminGuard } from '../auth/super-admin.guard';
import { SettingsService } from './settings.service';

class UpdateProfileDto { @IsString() @IsOptional() name: string; }
class UpdateNotificationsDto {
  @IsBoolean() notify_new_signup: boolean;
  @IsBoolean() notify_payment: boolean;
  @IsBoolean() notify_renewal_due: boolean;
  @IsBoolean() notify_expiry: boolean;
}

@Controller('settings')
@UseGuards(SuperAdminGuard)
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get('profile')
  getProfile(@Req() req: any) { return this.service.getProfile(req.user.sub); }

  @Patch('profile')
  updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.service.updateProfile(req.user.sub, dto.name);
  }

  @Get('notifications')
  getNotifications(@Req() req: any) { return this.service.getNotifications(req.user.sub); }

  @Patch('notifications')
  updateNotifications(@Req() req: any, @Body() dto: UpdateNotificationsDto) {
    return this.service.updateNotifications(req.user.sub, dto);
  }

  @Get('system')
  getSystem() { return this.service.getSystemSettings(); }

  @Patch('system')
  updateSystem() { return this.service.updateSystemSettings(); }
}
