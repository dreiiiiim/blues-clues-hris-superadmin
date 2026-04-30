import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class DashboardService {
  constructor(private readonly supabase: SupabaseService) {}

  async getStats() {
    const db = this.supabase.getClient();

    const [total, active, pending] = await Promise.all([
      db.from('company').select('company_id', { count: 'exact', head: true }),
      db.from('company_registrations').select('registration_id', { count: 'exact', head: true })
        .eq('subscription_status', 'Active'),
      db.from('company_registrations').select('registration_id', { count: 'exact', head: true })
        .eq('payment_status', 'Pending'),
    ]);

    return {
      total_companies: total.count ?? 0,
      active_subscriptions: active.count ?? 0,
      pending_approvals: pending.count ?? 0,
      monthly_revenue: null, // transaction_id is not an amount — cannot sum. Placeholder for payment integration.
    };
  }

  async getPendingApprovals() {
    const db = this.supabase.getClient();
    const { data, error } = await db
      .from('company_registrations')
      .select('registration_id, company_name, email, industry, subscription_plan, billing_cycle, registered_date')
      .eq('payment_status', 'Pending')
      .order('registered_date', { ascending: true });

    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }
}
