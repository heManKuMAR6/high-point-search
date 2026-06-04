import { Resend } from 'resend'

const FROM = 'High Point Search <noreply@highpointsearch.com>'
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

function canSendEmail(): boolean {
  const key = process.env.RESEND_API_KEY
  return !!(key && key !== 'will_add_later')
}

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

// HTML wrapper matching existing email style from lib/cron.ts
function emailWrapper(title: string, body: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:48px 20px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
<tr><td style="background:#1f6f8b;padding:28px 32px;border-radius:16px 16px 0 0;">
<div style="font-size:10px;font-weight:600;color:rgba(255,255,255,0.55);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">High Point Search</div>
<div style="font-size:22px;font-weight:300;color:#ffffff;letter-spacing:-0.02em;">${title}</div>
</td></tr>
<tr><td style="background:#ffffff;border-radius:0 0 16px 16px;padding:32px;">${body}
<div style="margin-top:32px;padding-top:20px;border-top:1px solid #f0f0f2;font-size:11px;color:#c0c0c5;text-align:center;">High Point Search · Specialized recruiting for 50+ and veterans</div>
</td></tr>
</table></td></tr></table></body></html>`
}

export async function sendWelcomeEmail(email: string, role: 'candidate' | 'employer'): Promise<void> {
  if (!canSendEmail()) return
  const resend = getResend()
  const dashboardUrl = role === 'candidate'
    ? `${BASE_URL}/apply/dashboard`
    : `${BASE_URL}/employers/dashboard`
  const body = role === 'candidate'
    ? `<p style="font-size:15px;color:#333;line-height:1.7;margin:0 0 20px;">Welcome to High Point Search! You're now part of a network built specifically for experienced professionals — 50+ and veterans — who deserve employers that value what they bring.</p>
       <p style="font-size:14px;color:#86868b;line-height:1.7;margin:0 0 28px;">Complete your onboarding and our matching engine will start finding you the right opportunities.</p>
       <a href="${dashboardUrl}" style="display:inline-block;padding:12px 28px;background:#1f6f8b;color:white;text-decoration:none;border-radius:10px;font-size:14px;font-weight:500;">Go to your dashboard</a>`
    : `<p style="font-size:15px;color:#333;line-height:1.7;margin:0 0 20px;">Welcome to High Point Search. Your employer account is ready.</p>
       <p style="font-size:14px;color:#86868b;line-height:1.7;margin:0 0 28px;">Post your first job listing and we'll match it with qualified experienced professionals and veterans.</p>
       <a href="${dashboardUrl}" style="display:inline-block;padding:12px 28px;background:#1f6f8b;color:white;text-decoration:none;border-radius:10px;font-size:14px;font-weight:500;">Go to your dashboard</a>`
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Welcome to High Point Search`,
    html: emailWrapper('Welcome aboard.', body),
  })
}

export async function sendApplicationStatusEmail(
  candidateEmail: string,
  jobTitle: string,
  newStatus: string
): Promise<void> {
  if (!canSendEmail()) return

  const statusMessages: Record<string, {
    subject: string
    headline: string
    detail: string
    color: string
  }> = {
    reviewed: {
      subject: `Your application was reviewed — ${jobTitle}`,
      headline: 'Your application has been reviewed',
      detail: "The employer has reviewed your application and it's moving forward in their process.",
      color: '#8B6200',
    },
    interview: {
      subject: `Interview request — ${jobTitle}`,
      headline: "You've been selected for an interview 🎉",
      detail: 'Congratulations! The employer wants to schedule an interview with you. Check your dashboard for details.',
      color: '#1F8B50',
    },
    offer: {
      subject: `You received an offer — ${jobTitle}`,
      headline: 'You received a job offer 🎉',
      detail: 'Congratulations! The employer has extended an offer for this position. Log in to view details.',
      color: '#2D7A3A',
    },
    rejected: {
      subject: `Update on your application — ${jobTitle}`,
      headline: 'Application update',
      detail: 'Thank you for your interest in this position. The employer has decided to move forward with other candidates. Keep applying — the right fit is out there.',
      color: '#86868b',
    },
  }

  const config = statusMessages[newStatus]
  if (!config) return // Don't email for 'submitted' or unknown status changes

  const resend = getResend()
  const body = `<div style="display:inline-block;padding:4px 12px;border-radius:100px;background:${config.color}18;color:${config.color};font-size:12px;font-weight:600;margin-bottom:16px;">${jobTitle}</div>
    <p style="font-size:18px;font-weight:400;color:#1d1d1f;margin:0 0 12px;">${config.headline}</p>
    <p style="font-size:14px;color:#86868b;line-height:1.7;margin:0 0 28px;">${config.detail}</p>
    <a href="${BASE_URL}/apply/dashboard" style="display:inline-block;padding:12px 28px;background:#1f6f8b;color:white;text-decoration:none;border-radius:10px;font-size:14px;font-weight:500;">View your dashboard</a>`

  await resend.emails.send({
    from: FROM,
    to: candidateEmail,
    subject: config.subject,
    html: emailWrapper('Application update', body),
  })
}

export async function sendNewApplicantEmail(
  employerEmail: string,
  candidateName: string,
  jobTitle: string,
  applicationId: string
): Promise<void> {
  if (!canSendEmail()) return
  const resend = getResend()
  const body = `<p style="font-size:15px;color:#333;line-height:1.7;margin:0 0 16px;"><strong>${candidateName}</strong> has applied for your <strong>${jobTitle}</strong> listing through High Point Search.</p>
    <p style="font-size:14px;color:#86868b;line-height:1.7;margin:0 0 28px;">Review their profile and resume in your employer dashboard.</p>
    <a href="${BASE_URL}/employers/dashboard" style="display:inline-block;padding:12px 28px;background:#1f6f8b;color:white;text-decoration:none;border-radius:10px;font-size:14px;font-weight:500;">Review applicant</a>`
  await resend.emails.send({
    from: FROM,
    to: employerEmail,
    subject: `New applicant for ${jobTitle}`,
    html: emailWrapper('New applicant received', body),
  })
}
