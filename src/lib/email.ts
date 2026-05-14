import nodemailer from 'nodemailer';
import { settingsService } from '@/modules/settings/services/settings.service';

export async function sendVerificationEmail(toEmail: string, code: string) {
  const host = await settingsService.getSetting('SMTP_HOST');
  const port = await settingsService.getSetting('SMTP_PORT', '465');
  const user = await settingsService.getSetting('SMTP_USER');
  const pass = await settingsService.getSetting('SMTP_PASS');
  const from = await settingsService.getSetting('SMTP_FROM', 'noreply@proxymanager.com');
  const requireVerification = await settingsService.getSetting('REQUIRE_EMAIL_VERIFICATION', 'false');

  if (requireVerification !== 'true') {
    return true; // Bỏ qua nếu không cấu hình bắt buộc
  }

  if (!host || !user || !pass) {
    throw new Error("Hệ thống SMTP chưa được cấu hình. Vui lòng liên hệ quản trị viên.");
  }

  const transporter = nodemailer.createTransport({
    host,
    port: parseInt(port, 10),
    secure: parseInt(port, 10) === 465,
    auth: {
      user,
      pass,
    },
  });

  const mailOptions = {
    from,
    to: toEmail,
    subject: 'Mã xác nhận tài khoản - Proxy Manager',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; text-align: center;">Xác nhận địa chỉ Email</h2>
        <p style="color: #334155; font-size: 16px;">Chào bạn,</p>
        <p style="color: #334155; font-size: 16px;">Cảm ơn bạn đã đăng ký tài khoản. Vui lòng sử dụng mã xác nhận dưới đây để hoàn tất quá trình đăng ký:</p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0;">
          <strong style="font-size: 32px; color: #3b82f6; letter-spacing: 5px;">${code}</strong>
        </div>
        <p style="color: #334155; font-size: 14px;">Mã này sẽ hết hạn sau 15 phút.</p>
        <p style="color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; padding-top: 15px; margin-top: 20px;">
          Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  return true;
}
