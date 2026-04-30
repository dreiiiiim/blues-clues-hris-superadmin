import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type SendMailOptions = {
  from?: string;
  to: string;
  subject: string;
  html: string;
};

// ─── Shared design tokens ─────────────────────────────────────────────────────
const BRAND = {
  name:       'Blues Clues Superadmin',
  monogram:   'SA',
  headerBg:   'linear-gradient(135deg,#0f172a 0%,#1a2f4e 60%,#0c3a5e 100%)',
  accent:     '#99e0fe',
  accentDark: '#0369a1',
  pageBg:     '#eef2f7',
  cardBg:     '#ffffff',
  border:     '#e2e8f0',
  textPrimary:'#020617',
  textBody:   '#374151',
  textMuted:  '#6b7280',
  textFaint:  '#9ca3af',
  surface:    '#f8fafc',
  footerBg:   '#f1f5f9',
};

const STATUS = {
  success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', badge: '#16a34a', headerBg: 'linear-gradient(135deg,#052e16 0%,#14532d 100%)' },
  danger:  { bg: '#fef2f2', border: '#fecaca', text: '#b91c1c', badge: '#dc2626', headerBg: 'linear-gradient(135deg,#3b0000 0%,#7f1d1d 100%)' },
  warning: { bg: '#fffbeb', border: '#fde68a', text: '#92400e', badge: '#d97706', headerBg: 'linear-gradient(135deg,#1c1400 0%,#78350f 100%)' },
  info:    { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', badge: '#3b82f6', headerBg: BRAND.headerBg },
};

function emailWrapper(headerHtml: string, bodyHtml: string, footerExtra = '') {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta name="color-scheme" content="light dark" />
<meta name="supported-color-schemes" content="light dark" />
<style>
  @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&family=Poppins:wght@600;700&display=swap');
  body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
  table,td{mso-table-lspace:0;mso-table-rspace:0;}
  img{-ms-interpolation-mode:bicubic;border:0;outline:none;text-decoration:none;}
  body{margin:0;padding:0;background:${BRAND.pageBg};}
  @media screen and (max-width:600px){
    .email-outer-padding{padding:20px 10px !important;}
    .email-body-padding{padding:24px 20px !important;}
    .email-header-padding{padding:28px 24px 24px !important;}
    .email-footer{padding:16px 20px !important;}
    .email-title{font-size:22px !important;}
    .email-card-wrap{border-radius:10px !important;}
  }
  @media screen and (prefers-color-scheme:dark){
    .email-bg{background-color:#0f172a !important;}
    .email-card-wrap{background-color:#1e293b !important;box-shadow:0 4px 32px rgba(0,0,0,0.5) !important;}
    .email-body-padding{background-color:#1e293b !important;}
    .email-footer{background-color:#0f172a !important;border-top-color:#334155 !important;}
    .email-text-primary{color:#f1f5f9 !important;}
    .email-text-body{color:#cbd5e1 !important;}
    .email-text-muted{color:#94a3b8 !important;}
    .email-text-faint{color:#64748b !important;}
    .email-divider{background:#334155 !important;}
    .email-info-card{background-color:#162032 !important;border-color:#334155 !important;}
    .email-note-card{background-color:#1a2535 !important;border-color:#334155 !important;}
    .email-badge-label{color:#94a3b8 !important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background:${BRAND.pageBg};font-family:'Open Sans',Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="email-bg email-outer-padding" style="background:${BRAND.pageBg};padding:40px 16px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
        <!-- Card -->
        <tr>
          <td class="email-card-wrap" style="background:${BRAND.cardBg};border-radius:16px;overflow:hidden;box-shadow:0 4px 32px rgba(15,23,42,0.10);">
            <!-- Header -->
            ${headerHtml}
            <!-- Body -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td class="email-body-padding" style="padding:36px 40px 32px;">${bodyHtml}</td></tr>
            </table>
            <!-- Footer -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td class="email-footer email-footer-padding" style="background:${BRAND.footerBg};border-top:1px solid ${BRAND.border};padding:20px 40px;">
                  ${footerExtra}
                  <p class="email-text-faint" style="margin:0;font-size:11px;color:${BRAND.textFaint};text-align:center;line-height:1.6;">
                    This is an automated message from <strong>${BRAND.name}</strong>. Please do not reply to this email.<br>
                    If you have questions, contact your HR administrator.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function brandHeader(title: string, subtitle?: string, bg = BRAND.headerBg) {
  const sub = subtitle
    ? `<p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.65);font-family:'Open Sans',sans-serif;">${subtitle}</p>`
    : '';
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td class="email-header-padding" style="background:${bg};padding:40px 40px 36px;">
      <!-- Wordmark row -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="background:${BRAND.accent};width:38px;height:38px;border-radius:9px;text-align:center;vertical-align:middle;">
            <span style="font-family:'Poppins',sans-serif;font-weight:700;font-size:15px;color:#0c1a2e;line-height:38px;display:block;">${BRAND.monogram}</span>
          </td>
          <td style="padding-left:12px;vertical-align:middle;">
            <span style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.16em;color:rgba(255,255,255,0.55);font-family:'Open Sans',sans-serif;">${BRAND.name}</span>
          </td>
        </tr>
      </table>
      <!-- Title -->
      <h1 class="email-title" style="margin:22px 0 0;font-family:'Poppins',sans-serif;font-size:26px;font-weight:700;color:#ffffff;line-height:1.25;">${title}</h1>
      ${sub}
    </td>
  </tr>
</table>`;
}

function ctaButton(href: string, label: string, color = BRAND.accentDark) {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px auto 0;">
  <tr>
    <td style="border-radius:10px;background:${color};">
      <a href="${href}" target="_blank" style="display:inline-block;padding:14px 36px;font-family:'Poppins',sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;letter-spacing:0.01em;">${label}</a>
    </td>
  </tr>
</table>`;
}

function infoCard(rows: { label: string; value: string }[], bg = STATUS.info.bg, border = STATUS.info.border) {
  const rowHtml = rows.map(r => `
    <tr>
      <td class="email-text-muted" style="padding:10px 0;border-bottom:1px solid ${border};font-size:13px;color:${BRAND.textMuted};font-family:'Open Sans',sans-serif;width:140px;vertical-align:top;">${r.label}</td>
      <td class="email-text-primary" style="padding:10px 0;border-bottom:1px solid ${border};font-size:13px;color:${BRAND.textPrimary};font-family:'Open Sans',sans-serif;font-weight:600;vertical-align:top;">${r.value}</td>
    </tr>`).join('');
  return `
<div class="email-info-card" style="background:${bg};border:1px solid ${border};border-radius:12px;padding:20px 24px;margin:20px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rowHtml}</table>
</div>`;
}

function noteCard(title: string, content: string, bg = BRAND.surface, border = BRAND.border, textColor = BRAND.textBody) {
  return `
<div class="email-note-card" style="background:${bg};border:1px solid ${border};border-radius:10px;padding:16px 20px;margin-top:16px;">
  <p class="email-badge-label" style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${BRAND.textMuted};font-family:'Open Sans',sans-serif;">${title}</p>
  <p class="email-text-body" style="margin:0;font-size:13px;color:${textColor};line-height:1.65;font-family:'Open Sans',sans-serif;white-space:pre-wrap;">${content}</p>
</div>`;
}

function divider() {
  return `<div class="email-divider" style="height:1px;background:${BRAND.border};margin:24px 0;"></div>`;
}

function bodyText(html: string, bg = STATUS.info.bg, border = STATUS.info.border) {
  return `<p class="email-text-body" style="margin:0;font-size:14px;line-height:1.7;color:${BRAND.textBody};font-family:'Open Sans',sans-serif;">${html}</p>`;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class MailService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly senderEmail: string;
  private readonly senderName: string;
  private readonly from: string;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('BREVO_API_KEY') ?? '';
    this.baseUrl = this.config.get<string>('BREVO_BASE_URL') ?? 'https://api.brevo.com';
    this.senderEmail = this.config.get<string>('BREVO_SENDER_EMAIL') ?? '';
    this.senderName = this.config.get<string>('BREVO_SENDER_NAME') ?? 'Blues Clues Superadmin';
    this.timeoutMs = Number(this.config.get<string>('BREVO_TIMEOUT_MS') ?? 15000);

    this.from = `"${this.senderName}" <${this.senderEmail}>`;

    if (!this.apiKey || !this.senderEmail) {
      this.logger.warn('Brevo email is not fully configured. Set BREVO_API_KEY and BREVO_SENDER_EMAIL.');
    }
  }

  private async sendMail(options: SendMailOptions): Promise<void> {
    if (!this.apiKey || !this.senderEmail) {
      throw new Error('Brevo email is not configured');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl.replace(/\/$/, '')}/v3/smtp/email`, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': this.apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            email: this.senderEmail,
            name: this.senderName,
          },
          to: [{ email: options.to }],
          subject: options.subject,
          htmlContent: options.html,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`Brevo send failed with HTTP ${response.status}: ${body}`);
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  // ─── Superadmin Templates ─────────────────────────────────────────────────────

  async sendRenewalReminder(to: string, companyName: string, daysRemaining: number, plan: string) {
    const urgency = daysRemaining <= 7 ? STATUS.danger : daysRemaining <= 14 ? STATUS.warning : STATUS.info;
    const subject = daysRemaining <= 0
      ? `Subscription Expired — ${companyName}`
      : `Renewal Reminder: ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining — ${companyName}`;

    const html = emailWrapper(
      brandHeader('Subscription Renewal', urgency.headerBg),
      bodyText(`Your <strong>${plan}</strong> subscription for <strong>${companyName}</strong> ` +
        (daysRemaining <= 0
          ? 'has <strong>expired</strong>. Please renew to restore access.'
          : `will expire in <strong>${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}</strong>. Please renew to avoid service interruption.`),
        urgency.bg, urgency.border),
    );
    return this.sendMail({ to, subject, html });
  }

  async sendSuspensionNotice(to: string, companyName: string) {
    const html = emailWrapper(
      brandHeader('Account Suspended', STATUS.danger.headerBg),
      bodyText(`The subscription for <strong>${companyName}</strong> has been <strong>suspended</strong>. ` +
        'Your users will not be able to log in until the subscription is reactivated. Contact support to resolve.',
        STATUS.danger.bg, STATUS.danger.border),
    );
    return this.sendMail({ to, subject: `Account Suspended — ${companyName}`, html });
  }

  async sendApprovalNotification(to: string, companyName: string, approved: boolean) {
    const status = approved ? STATUS.success : STATUS.danger;
    const html = emailWrapper(
      brandHeader(approved ? 'Registration Approved' : 'Registration Rejected', status.headerBg),
      bodyText(approved
        ? `The registration for <strong>${companyName}</strong> has been <strong>approved</strong>. Your account is being provisioned.`
        : `The registration for <strong>${companyName}</strong> has been <strong>rejected</strong>. Please contact support for details.`,
        status.bg, status.border),
    );
    return this.sendMail({ to, subject: `Registration ${approved ? 'Approved' : 'Rejected'} — ${companyName}`, html });
  }
}
