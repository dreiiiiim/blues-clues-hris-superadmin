import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { CompaniesModule } from './companies/companies.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    AuthModule,
    MailModule,
    CompaniesModule,
    SubscriptionsModule,
  ],
})
export class AppModule {}
