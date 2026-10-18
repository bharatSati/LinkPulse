import nodemailer from 'nodemailer';
import env from '../config/env.js';

let transporter = null;

export function isEmailConfigured() {
  return Boolean(env.smtpHost && env.mailFrom);
}

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: env.smtpUser ? { user: env.smtpUser, pass: env.smtpPass } : undefined,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });

  return transporter;
}

/*
 * Verifies the SMTP connection/credentials without sending an email. Useful for
 * startup diagnostics; never throws for callers that treat it as best-effort.
 */
export async function verifyEmailTransport() {
  if (!isEmailConfigured()) return { ok: false, reason: 'not_configured' };
  await getTransporter().verify();
  return { ok: true };
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildInvitationEmail({ workspaceName, inviterName, role, inviteUrl, expiresAt }) {
  const inviter = inviterName || 'A teammate';
  const workspace = workspaceName || 'a workspace';
  const subject = `You're invited to join ${workspace} on LinkPulse`;
  const expiry = expiresAt ? new Date(expiresAt).toUTCString() : null;

  const text = [
    `${inviter} invited you to join "${workspace}" as ${role}.`,
    '',
    `Accept your invitation: ${inviteUrl}`,
    expiry ? '' : null,
    expiry ? `This link expires on ${expiry}.` : null,
    '',
    'If you were not expecting this invitation, you can ignore this email.',
  ]
    .filter((line) => line !== null)
    .join('\n');

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#0b0e06;color:#f4fce0;font-family:'JetBrains Mono',ui-monospace,SFMono-Regular,monospace;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;border:2px solid #415127;background:#141a0c;">
      <tr>
        <td style="padding:24px;">
          <p style="margin:0 0 16px;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#cdf23f;">LinkPulse</p>
          <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;color:#f4fce0;">You're invited to ${escapeHtml(workspace)}</h1>
          <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#c4d39c;">
            ${escapeHtml(inviter)} invited you to join <strong style="color:#f4fce0;">${escapeHtml(workspace)}</strong>
            as <strong style="color:#f4fce0;">${escapeHtml(role)}</strong>.
          </p>
          <p style="margin:0 0 24px;">
            <a href="${escapeHtml(inviteUrl)}" style="display:inline-block;padding:12px 20px;background:#cdf23f;color:#0b0e06;font-weight:700;text-decoration:none;font-size:14px;">Accept invitation</a>
          </p>
          ${
            expiry
              ? `<p style="margin:0 0 12px;font-size:12px;color:#7a8858;">This link expires on ${escapeHtml(expiry)}.</p>`
              : ''
          }
          <p style="margin:0;font-size:12px;line-height:1.6;color:#7a8858;">
            If the button does not work, copy and paste this URL into your browser:<br />
            <span style="color:#cdf23f;word-break:break-all;">${escapeHtml(inviteUrl)}</span>
          </p>
        </td>
      </tr>
    </table>
    <p style="max-width:520px;margin:16px auto 0;font-size:11px;color:#5d6a41;">
      If you were not expecting this invitation, you can ignore this email.
    </p>
  </body>
</html>`;

  return { subject, text, html };
}

/*
 * Sends a workspace invitation email over SMTP with Nodemailer. Returns
 * `{ sent: false }` when email delivery is not configured. Throws when the
 * transport rejects the message so the caller can decide how to surface it.
 */
export async function sendInvitationEmail({
  to,
  inviteUrl,
  workspaceName,
  inviterName,
  role,
  expiresAt,
}) {
  if (!isEmailConfigured()) {
    return { sent: false, reason: 'not_configured' };
  }

  const { subject, text, html } = buildInvitationEmail({
    workspaceName,
    inviterName,
    role,
    inviteUrl,
    expiresAt,
  });

  const info = await getTransporter().sendMail({
    from: env.mailFrom,
    to,
    subject,
    text,
    html,
    replyTo: env.mailReplyTo || undefined,
  });

  return { sent: true, messageId: info.messageId };
}
