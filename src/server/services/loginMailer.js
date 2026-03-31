/* Login notification mailer
 * Sends an email alert whenever a user successfully logs in.
 * Uses the same nodemailer transport already configured in config.js.
 */

const nodemailer = require('nodemailer');
const config = require('../config');
const { log } = require('../log');

/**
 * Send a login-alert email.
 * @param {string} username  - The username that just logged in.
 * @param {string} role      - The role of that user.
 * @param {string} ip        - The client IP address.
 * @param {Date}   timestamp - When the login happened.
 */
async function sendLoginNotification(username, role, ip, timestamp) {
	// Skip if mailer is not configured
	if (!config.mailer || config.mailer.method === 'none' || !config.mailer.method) {
		return;
	}

	if (!config.mailer.to || !config.mailer.from) {
		return;
	}

	let transporter;
	try {
		if (config.mailer.method === 'secure-smtp') {
			transporter = nodemailer.createTransport({
				host: config.mailer.smtp,
				port: config.mailer.port,
				secure: true,
				auth: {
					user: config.mailer.ident,
					pass: config.mailer.credential
				}
			});
		} else {
			// Unknown method – silently skip
			return;
		}
	} catch (err) {
		log.error(`[LoginMailer] Failed to create transporter: ${err.message}`);
		return;
	}

	const formattedTime = timestamp.toLocaleString('en-IN', {
		timeZone: 'Asia/Kolkata',
		hour12: true,
		year: 'numeric', month: 'short', day: '2-digit',
		hour: '2-digit', minute: '2-digit', second: '2-digit'
	});

	const org = config.mailer.org || 'OED';

	const subject = `[${org}] Login Alert – ${username} logged in`;

	const html = `
		<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
			<div style="background:#1e293b;padding:20px 24px;">
				<h2 style="color:#ffffff;margin:0;font-size:18px;">🔐 Login Notification</h2>
				<p style="color:#94a3b8;margin:4px 0 0;font-size:13px;">${org} Energy Dashboard</p>
			</div>
			<div style="padding:24px;background:#f8fafc;">
				<p style="margin:0 0 16px;color:#374151;font-size:14px;">
					A user has successfully logged into the dashboard.
				</p>
				<table style="width:100%;border-collapse:collapse;font-size:14px;">
					<tr style="border-bottom:1px solid #e5e7eb;">
						<td style="padding:10px 8px;color:#6b7280;width:40%;">Username</td>
						<td style="padding:10px 8px;color:#111827;font-weight:600;">${username}</td>
					</tr>
					<tr style="border-bottom:1px solid #e5e7eb;">
						<td style="padding:10px 8px;color:#6b7280;">Role</td>
						<td style="padding:10px 8px;color:#111827;font-weight:600;">${role}</td>
					</tr>
					<tr style="border-bottom:1px solid #e5e7eb;">
						<td style="padding:10px 8px;color:#6b7280;">IP Address</td>
						<td style="padding:10px 8px;color:#111827;font-family:monospace;">${ip}</td>
					</tr>
					<tr>
						<td style="padding:10px 8px;color:#6b7280;">Time</td>
						<td style="padding:10px 8px;color:#111827;">${formattedTime} (IST)</td>
					</tr>
				</table>
				<p style="margin:20px 0 0;font-size:12px;color:#9ca3af;">
					If this was not you, please contact your system administrator immediately.
				</p>
			</div>
		</div>
	`;

	const mailOptions = {
		from: config.mailer.from,
		to: config.mailer.to,
		subject,
		html
	};

	try {
		const info = await transporter.sendMail(mailOptions);
		log.info(`[LoginMailer] Alert sent for user "${username}" — ${info.response}`);
	} catch (err) {
		log.error(`[LoginMailer] Failed to send login alert: ${err.message}`);
	}
}

module.exports = { sendLoginNotification };
