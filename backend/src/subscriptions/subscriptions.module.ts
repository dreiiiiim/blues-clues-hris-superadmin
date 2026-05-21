import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';
import { SubscriptionsController } from './subscriptions.controller';
import { InternalController } from './internal.controller';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [SubscriptionsController, InternalController],
  providers: [SubscriptionsService],
})
export class SubscriptionsModule {}
