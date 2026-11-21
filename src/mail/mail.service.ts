import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log(`SMTP Mailer initialized successfully with ${host}:${port}`);
    } else {
      this.logger.warn(
        'SMTP credentials not fully provided in .env (SMTP_HOST, SMTP_USER, SMTP_PASS). Emails will be logged to Console for Development.',
      );
    }
  }

  async sendPasswordResetOtp(toEmail: string, otp: string, userName?: string): Promise<boolean> {
    const displayName = userName || 'Quý khách';
    const appName = 'PDTKEY';
    const supportEmail = process.env.EMAIL_SUPPORT || 'support@pdtkey.com';

    // Tạo các ô số OTP riêng biệt phong cách hiện đại (chip style)
    const otpDigits = otp.trim().split('');
    const otpCells = otpDigits
      .map(
        (digit) => `
        <td style="width: 44px; height: 52px; background: #162238; border: 1.5px solid #3b82f6; border-radius: 12px; font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace; font-size: 28px; font-weight: 800; color: #38bdf8; text-align: center; vertical-align: middle; box-shadow: 0 4px 12px rgba(37,99,235,0.25); text-shadow: 0 0 8px rgba(56,189,248,0.4);">
          ${digit}
        </td>`,
      )
      .join('');

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Mã xác thực đặt lại mật khẩu - ${appName}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #070b14; margin: 0; padding: 32px 16px; color: #e2e8f0; -webkit-font-smoothing: antialiased;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 540px; margin: 0 auto; background: #0e1626; border: 1px solid #1e293b; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);">
        <!-- Top Gradient Highlight Line -->
        <tr>
          <td style="height: 4px; background: linear-gradient(90deg, #38bdf8 0%, #6366f1 50%, #06b6d4 100%);"></td>
        </tr>

        <!-- Brand Header Section -->
        <tr>
          <td style="padding: 36px 36px 20px 36px; text-align: center;">
            <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 14px; background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); text-align: center; color: #ffffff; font-size: 22px; font-weight: bold; box-shadow: 0 6px 16px rgba(37,99,235,0.35); margin-bottom: 12px;">
              🛡️
            </div>
            <div style="font-size: 24px; font-weight: 900; letter-spacing: 1.5px; color: #ffffff;">
              PDT<span style="color: #38bdf8;">KEY</span>
            </div>
            <div style="display: inline-block; margin-top: 8px; padding: 4px 12px; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 20px; font-size: 11px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.8px;">
              Bảo Mật Tài Khoản
            </div>
          </td>
        </tr>

        <!-- Main Content Section -->
        <tr>
          <td style="padding: 10px 36px 28px 36px;">
            <div style="font-size: 16px; font-weight: 700; color: #ffffff; margin-bottom: 12px;">
              Xin chào <span style="color: #60a5fa;">${displayName}</span>,
            </div>
            <div style="font-size: 14px; line-height: 1.65; color: #94a3b8; margin-bottom: 24px;">
              Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong style="color: #f1f5f9;">${toEmail}</strong> tại hệ sinh thái <strong>${appName}</strong>. Hãy sử dụng mã xác thực bảo mật bên dưới để tiếp tục:
            </div>

            <!-- OTP Card Container -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #080d19; border: 1px solid #1a2538; border-radius: 16px; padding: 22px 16px; text-align: center; margin-bottom: 24px; box-shadow: inset 0 2px 8px rgba(0,0,0,0.4);">
              <tr>
                <td style="text-align: center;">
                  <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; color: #64748b; text-transform: uppercase; margin-bottom: 14px;">
                    MÃ XÁC THỰC OTP
                  </div>

                  <!-- OTP Digit Cells -->
                  <table align="center" cellpadding="0" cellspacing="6" border="0" style="margin: 0 auto;">
                    <tr>
                      ${otpCells}
                    </tr>
                  </table>

                  <!-- Countdown Tag -->
                  <div style="margin-top: 14px; font-size: 12px; color: #64748b;">
                    ⏱️ Mã có hiệu lực trong vòng <strong style="color: #cbd5e1;">10 phút</strong>
                  </div>
                </td>
              </tr>
            </table>

            <!-- Security Warning Card -->
            <table width="100%" cellpadding="14" cellspacing="0" border="0" style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.22); border-radius: 12px; margin-bottom: 24px;">
              <tr>
                <td style="width: 26px; vertical-align: top; font-size: 18px; line-height: 1.2;">⚠️</td>
                <td style="font-size: 12.5px; line-height: 1.6; color: #fde68a;">
                  <strong>Cảnh báo an toàn:</strong> Tuyệt đối không cung cấp mã OTP này cho bất kỳ ai, kể cả nhân viên hỗ trợ của PDTKEY để bảo vệ an toàn cho tài khoản của bạn.
                </td>
              </tr>
            </table>

            <!-- Reassurance Note -->
            <div style="font-size: 13px; line-height: 1.6; color: #64748b; margin-bottom: 8px;">
              Nếu bạn không yêu cầu đổi mật khẩu, vui lòng bỏ qua thư này. Mật khẩu hiện tại của bạn vẫn an toàn tuyệt đối.
            </div>
          </td>
        </tr>

        <!-- Footer Section -->
        <tr>
          <td style="background: #080d19; border-top: 1px solid #1a2538; padding: 22px 36px; text-align: center; font-size: 12px; color: #64748b; line-height: 1.6;">
            <div style="font-weight: 600; color: #94a3b8; margin-bottom: 4px;">
              © 2026 ${appName} • Nền tảng bản quyền số & phần mềm chính hãng
            </div>
            <div>
              Hỗ trợ: <a href="mailto:${supportEmail}" style="color: #38bdf8; text-decoration: none;">${supportEmail}</a> &nbsp;|&nbsp; Hotline: <span style="color: #cbd5e1;">078829507</span>
            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    // 1. Luôn in ra console để dev test tức thì
    this.logger.log(`=======================================================`);
    this.logger.log(`🔑 [PASSWORD RESET OTP] Gửi tới: ${toEmail}`);
    this.logger.log(`👉 MÃ OTP: [ ${otp} ] (Hiệu lực: 10 phút)`);
    this.logger.log(`=======================================================`);

    // 2. Nếu có cấu hình SMTP -> gửi email thật
    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: `"${appName}" <${process.env.SMTP_USER}>`,
          to: toEmail,
          subject: `[${appName}] Mã xác thực đặt lại mật khẩu: ${otp}`,
          html: htmlContent,
        });
        this.logger.log(`✅ Đã gửi email OTP thành công tới ${toEmail}`);
        return true;
      } catch (err) {
        this.logger.error(`❌ Gửi email qua SMTP thất bại: ${err.message}`, err.stack);
        return false;
      }
    }

    return true;
  }
}
