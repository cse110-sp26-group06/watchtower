/**
 * cron/digest.js
 * Daily digest cron job — runs every day at 9am PST (17:00 UTC)
 * Sends email notifications to users with email_enabled = 1
 */

/**
 * Builds the HTML email body for the daily digest
 * @param {string} projectName
 * @param {number} errorCount
 * @param {object[]} topErrors
 * @returns {string}
 */
function buildEmailHtml(projectName, errorCount, topErrors) {
  const rowColors = ['#A32D2D', '#185FA5', '#3B6D11'];
  const errorRows = topErrors.map((e, i) => `
    <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #C8B89A; background: #F5F0E8;">
            <div style="font-size: 13px; color: ${rowColors[i] || '#2C1A0E'}; font-family: 'Courier New', monospace; font-weight: 700;">${e.message}</div>
            <div style="font-size: 11px; color: #8C7B6B; margin-top: 3px; font-style: italic;">${e.error_type || 'Error'}</div>
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #C8B89A; text-align: right; vertical-align: middle; background: #F5F0E8; white-space: nowrap;">
            <span style="font-size: 22px; font-weight: 700; color: ${rowColors[i] || '#2C1A0E'}; font-family: Georgia, serif;">${e.count}</span>
            <div style="font-size: 10px; color: #8C7B6B; letter-spacing: 1px; text-transform: uppercase;">times</div>
        </td>
    </tr>
  `).join('');

  return `
    <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 580px; margin: 0 auto; background: #F5F0E8; border: 1px solid #C8B89A;">

        <!-- Masthead -->
        <div style="background: #F5F0E8; border-bottom: 3px double #2C1A0E; padding: 28px 32px 18px; text-align: center;">
            <div style="display: inline-flex; align-items: center; gap: 14px; margin-bottom: 14px;">
                <svg width="44" height="58" viewBox="0 0 48 64" style="flex-shrink:0;" fill="#F97316" xmlns="http://www.w3.org/2000/svg">
                    <ellipse cx="24" cy="62" rx="14" ry="2"/>
                    <rect x="18" y="54" width="12" height="8" rx="2"/>
                    <polygon points="12,54 36,54 32,20 16,20"/>
                    <rect x="14" y="15" width="20" height="5" rx="1"/>
                    <rect x="17" y="8" width="14" height="7" rx="2"/>
                    <circle cx="24" cy="5" r="3"/>
                    <rect x="20" y="30" width="8" height="5" rx="1" fill="#F5F0E8"/>
                    <rect x="20" y="40" width="8" height="5" rx="1" fill="#F5F0E8"/>
                </svg>
                <div style="text-align: left;">
                    <h1 style="font-family: Georgia, serif; font-size: 40px; font-weight: 700; color: #2C1A0E; margin: 0; letter-spacing: 3px; line-height: 1;">WATCHTOWER</h1>
                    <p style="font-size: 12px; color: #8C7B6B; margin: 5px 0 0; letter-spacing: 5px; text-transform: uppercase; font-style: italic;">Daily Digest</p>
                </div>
            </div>
            <div style="border-top: 1px solid #C8B89A; padding-top: 10px;">
                <p style="font-size: 11px; color: #8C7B6B; margin: 0; letter-spacing: 1px;">${new Date().toDateString().toUpperCase()}</p>
            </div>
        </div>

        <!-- Project banner -->
        <div style="background: #2C1A0E; padding: 14px 32px; text-align: center;">
            <p style="font-size: 22px; font-weight: 700; color: #F5F0E8; margin: 0; letter-spacing: 1px; font-family: Georgia, serif;">${projectName}</p>
            <p style="font-size: 10px; color: #A89080; margin: 4px 0 0; letter-spacing: 3px; text-transform: uppercase;">Production Environment</p>
        </div>

        <!-- Body -->
        <div style="padding: 28px 32px; background: #F5F0E8;">

            <!-- Error count -->
            <div style="border: 1px solid #C8B89A; padding: 24px; text-align: center; margin-bottom: 28px; background: #EDE8DF;">
                <p style="font-size: 11px; color: #8C7B6B; margin: 0 0 8px; letter-spacing: 3px; text-transform: uppercase;">Errors in the last 24 hours</p>
                <p style="font-size: 64px; font-weight: 700; color: #2C1A0E; margin: 0; font-family: Georgia, serif; line-height: 1;">${errorCount}</p>
                <p style="font-size: 11px; color: #8C7B6B; margin: 8px 0 0; letter-spacing: 2px; text-transform: uppercase;">errors detected</p>
            </div>

            ${errorCount > 0 ? `
                <!-- Top errors heading -->
                <div style="border-top: 2px solid #2C1A0E; border-bottom: 1px solid #2C1A0E; padding: 4px 0; margin-bottom: 12px;">
                    <p style="font-size: 11px; color: #2C1A0E; margin: 0; letter-spacing: 3px; text-transform: uppercase; font-weight: 700; text-align: center;">Top Errors</p>
                </div>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px; border: 1px solid #C8B89A;">
                    ${errorRows}
                </table>
            ` : `
                <p style="color: #8C7B6B; font-size: 14px; text-align: center; padding: 20px 0; font-style: italic; border: 1px solid #C8B89A; margin-bottom: 28px;">No errors in the last 24 hours. All clear!</p>
            `}

            <!-- CTA -->
            <div style="text-align: center; margin-bottom: 28px;">
                <a href="https://cse110-sp26-group06.github.io/watchtower/dashboard"
                    style="display: inline-block; background: #F97316; color: #ffffff; padding: 13px 40px; font-size: 12px; font-weight: 700; text-decoration: none; letter-spacing: 2px; text-transform: uppercase; font-family: Georgia, serif;">
                    View Dashboard →
                </a>
            </div>

            <!-- Footer -->
            <div style="border-top: 1px solid #C8B89A; padding-top: 14px; text-align: center;">
                <p style="font-size: 11px; color: #8C7B6B; margin: 0; font-style: italic;">
                    You're receiving this because you enabled daily digests for <strong>${projectName}</strong>.
                </p>
            </div>
        </div>

        <!-- Bottom rule -->
        <div style="border-top: 3px double #2C1A0E; background: #F5F0E8; height: 6px;"></div>
    </div>
  `;
}

/**
 * Sends a daily digest email via Resend
 * @param {string} to - recipient email
 * @param {string} subject
 * @param {string} html
 * @param {string} resendApiKey
 */
async function sendEmail(to, subject, html, resendApiKey) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'WatchTower <onboarding@resend.dev>',
      to,
      subject,
      html
    })
  });
  if (!res.ok) {
    console.error('Failed to send email:', await res.text());
  }
}

/**
 * Main cron handler — queries D1 and sends daily digests
 * @param {object} env - Cloudflare env with D1 binding and RESEND_API_KEY
 */
export async function sendDailyDigests(env) {
  const settings = await env.watchtower_db.prepare(
    'SELECT ns.user_id, ns.project_id, u.email, p.name as project_name, p.api_key FROM notification_settings ns JOIN users u ON ns.user_id = u.id JOIN projects p ON ns.project_id = p.id WHERE ns.email_enabled = 1'
  ).all();

  for (const setting of settings.results) {
    const countResult = await env.watchtower_db.prepare(
      "SELECT COUNT(*) as count FROM errors WHERE api_key = ? AND server_timestamp >= datetime('now', '-1 day')"
    ).bind(setting.api_key).first();

    const errorCount = countResult?.count ?? 0;

    const topErrors = await env.watchtower_db.prepare(
      "SELECT message, error_type, COUNT(*) as count FROM errors WHERE api_key = ? AND server_timestamp >= datetime('now', '-1 day') GROUP BY message ORDER BY count DESC LIMIT 3"
    ).bind(setting.api_key).all();

    const html = buildEmailHtml(setting.project_name, errorCount, topErrors.results);
    const subject = `WatchTower Daily Digest — ${setting.project_name} (${errorCount} errors)`;

    await sendEmail(setting.email, subject, html, env.RESEND_API_KEY);
    console.log(`Sent digest to ${setting.email} for project ${setting.project_name}`);
  }
}