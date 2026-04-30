import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { RenewalsController } from './renewals.controller';
import { RenewalsService } from './renewals.service';

@Module({
  imports: [SupabaseModule, AuthModule, MailModule],
  controllers: [RenewalsController],
  providers: [RenewalsService],
})
export class RenewalsModule {}
