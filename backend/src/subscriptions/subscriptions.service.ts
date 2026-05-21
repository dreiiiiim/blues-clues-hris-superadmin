import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService,
  ) {}

  private computeEndDate(paymentDate: string, billingCycle: string): string {
    if (!paymentDate) return '';
    const d = new Date(paymentDate);
    if (billingCycle === 'annual') d.setFullYear(d.getFullYear() + 1);
    else d.setMonth(d.getMonth() + 1);
    return d.toISOString();
  }

  async list(query: { status?: string; billing_cycle?: string; page?: number; limit?: number }) {
    const db = this.supabase.getClient();
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    let q = db
      .from('company_registrations')
      .select(
        'registration_id, company_id, company_name, subscription_plan, billing_cycle, subscription_status, payment_status, payment_date, transaction_id',
        { count: 'exact' },
      )
      .range(offset, offset + limit - 1)
      .order('payment_date', { ascending: false });

    if (query.status) q = q.ilike('subscription_status', query.status);
    if (query.billing_cycle) q = q.eq('billing_cycle', query.billing_cycle);

    const { data, error, count } = await q;
    if (error) throw new BadRequestException(error.message);

    const enriched = (data ?? []).map(r => ({
      ...r,
      start_date: r.payment_date,
      end_date: this.computeEndDate(r.payment_date, r.billing_cycle),
    }));

    return { data: enriched, total: count, page, limit };
  }

  async detail(registrationId: string) {
    const db = this.supabase.getClient();
    const { data, error } = await db
      .from('company_registrations')
      .select('*')
      .eq('registration_id', registrationId)
      .maybeSingle();
    if (error || !data) throw new NotFoundException('Subscription not found');
    return {
      ...data,
      start_date: data.payment_date,
      end_date: this.computeEndDate(data.payment_date, data.billing_cycle),
    };
  }

  async updateStatus(registrationId: string, subscriptionStatus: string, performedBy: string) {
    const db = this.supabase.getClient();
    const { error } = await db
      .from('company_registrations')
      .update({ subscription_status: subscriptionStatus })
      .eq('registration_id', registrationId);
    if (error) throw new BadRequestException(error.message);

    await db.from('admin_audit_logs').insert({
      action: `SUBSCRIPTION_STATUS_UPDATE: ${registrationId} → ${subscriptionStatus}`,
      performed_by: performedBy,
      severity: 'INFO',
    });
    return { success: true };
  }

  async paymentHistory(registrationId: string) {
    const db = this.supabase.getClient();
    const { data, error } = await db
      .from('company_registrations')
      .select('registration_id, payment_status, payment_date, transaction_id, billing_cycle, subscription_plan')
      .eq('registration_id', registrationId)
      .maybeSingle();
    if (error || !data) throw new NotFoundException('Subscription not found');
    return { records: [data], total: 1 };
  }

  // ─── Provisioning ────────────────────────────────────────────────────────────

  async provision(registrationId: string) {
    const db = this.supabase.getClient();

    const { data: reg, error: regErr } = await db
      .from('company_registrations')
      .select('registration_id, company_id, company_name, email, payment_status')
      .eq('registration_id', registrationId)
      .maybeSingle();

    if (regErr || !reg) throw new NotFoundException('Subscription not found');
    if (reg.payment_status !== 'Paid') {
      throw new BadRequestException('Cannot provision: payment not confirmed (status must be Paid)');
    }
    if (!reg.company_id) {
      throw new BadRequestException('Cannot provision: company not yet created (Phase 1 may not have run)');
    }

    const { data: company, error: companyErr } = await db
      .from('company')
      .select('company_id, slug')
      .eq('company_id', reg.company_id)
      .maybeSingle();

    if (companyErr || !company) throw new NotFoundException('Company record not found');

    const { data: existing } = await db
      .from('instances')
      .select('instance_id, status')
      .eq('company_id', reg.company_id)
      .maybeSingle();

    if (existing) {
      throw new ConflictException(`Instance already exists with status: ${existing.status}`);
    }

    const schemaName = `hris_${company.slug.replace(/-/g, '_')}`;

    const { data: instance, error: instanceErr } = await db
      .from('instances')
      .insert({
        company_id: reg.company_id,
        status: 'provisioning',
        schema_name: schemaName,
      })
      .select('instance_id')
      .single();

    if (instanceErr || !instance) {
      throw new InternalServerErrorException('Failed to create instance record');
    }

    try {
      await this.triggerGHAWorkflow({
        company_id: reg.company_id,
        company_slug: company.slug,
        admin_email: reg.email,
        instance_id: instance.instance_id,
      });
    } catch (err) {
      this.logger.error('GHA workflow_dispatch failed — instance created but pipeline not started', err);
    }

    return { instance_id: instance.instance_id, status: 'provisioning', schema_name: schemaName };
  }

  private async triggerGHAWorkflow(inputs: {
    company_id: string;
    company_slug: string;
    admin_email: string;
    instance_id: string;
  }): Promise<void> {
    const owner = this.config.get<string>('GH_OWNER');
    const repo = this.config.get<string>('GH_REPO');
    const pat = this.config.get<string>('GH_PAT');

    if (!owner || !repo || !pat) {
      throw new Error('GitHub provisioning env vars (GH_OWNER, GH_REPO, GH_PAT) not configured');
    }

    const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/provision-instance.yml/dispatches`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${pat}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({ ref: 'main', inputs }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`GitHub API ${res.status}: ${body}`);
    }
  }

  async getInstance(registrationId: string) {
    const db = this.supabase.getClient();

    const { data: reg } = await db
      .from('company_registrations')
      .select('company_id')
      .eq('registration_id', registrationId)
      .maybeSingle();

    if (!reg?.company_id) return null;

    const { data } = await db
      .from('instances')
      .select('instance_id, status, schema_name, access_url, error_message, created_at, updated_at')
      .eq('company_id', reg.company_id)
      .maybeSingle();

    return data ?? null;
  }

  async markActive(instanceId: string) {
    const db = this.supabase.getClient();
    const { error } = await db
      .from('instances')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('instance_id', instanceId);
    if (error) throw new InternalServerErrorException(error.message);
    return { success: true };
  }

  async markFailed(instanceId: string, errorMessage: string) {
    const db = this.supabase.getClient();
    const { error } = await db
      .from('instances')
      .update({
        status: 'failed',
        error_message: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('instance_id', instanceId);
    if (error) throw new InternalServerErrorException(error.message);
    return { success: true };
  }
}
