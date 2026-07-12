import nodemailer from 'nodemailer';

// Create a SMTP transporter
const getTransporter = () => {
  const host = process.env.EMAIL_HOST || 'smtp.mailtrap.io';
  const port = parseInt(process.env.EMAIL_PORT || '2525', 10);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    // If no credentials, log a warning and return a dummy transporter that prints to console
    console.warn('⚠️ SMTP email credentials missing. Email utility will run in simulation mode.');
    return {
      sendMail: async (options: any) => {
        console.log('✉️ [Email Simulation Mode]');
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Body (HTML length): ${options.html?.length || 0} characters`);
        if (options.text) console.log(`Text: ${options.text}`);
        return { messageId: 'simulated-id-' + Math.random().toString(36).substr(2, 9) };
      }
    } as any;
  }

  return nodemailer.createTransport({
    host,
    port,
    auth: {
      user,
      pass
    }
  });
};

const transporter = getTransporter();
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@assetflow.com';

/**
 * Send Welcome Email
 */
export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #2563eb; margin-bottom: 20px;">Welcome to AssetFlow, ${name}!</h2>
      <p>Your enterprise employee account has been successfully created.</p>
      <p>You can now log in to the AssetFlow ERP portal using your credentials to view your assigned assets, request maintenance, or make resource bookings.</p>
      <p style="margin-top: 30px; font-size: 14px; color: #64748b;">If you did not register for this account, please contact your administrator immediately.</p>
      <hr style="margin: 30px 0; border: 0; border-top: 1px solid #e2e8f0;" />
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">AssetFlow ERP © ${new Date().getFullYear()}</p>
    </div>
  `;

  await transporter.sendMail({
    from: EMAIL_FROM,
    to: email,
    subject: 'Welcome to AssetFlow ERP',
    html
  });
}

/**
 * Send Password Reset Link Email
 */
export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resetLink = `${clientUrl}/reset-password/${resetToken}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #ef4444; margin-bottom: 20px;">Reset Your Password</h2>
      <p>We received a request to reset the password for your AssetFlow ERP account.</p>
      <p>Click the button below to set a new password. This link is valid for 1 hour.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
      <p style="word-break: break-all; color: #2563eb;"><a href="${resetLink}">${resetLink}</a></p>
      <p style="margin-top: 30px; font-size: 14px; color: #64748b;">If you did not request a password reset, you can safely ignore this email.</p>
      <hr style="margin: 30px 0; border: 0; border-top: 1px solid #e2e8f0;" />
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">AssetFlow ERP © ${new Date().getFullYear()}</p>
    </div>
  `;

  await transporter.sendMail({
    from: EMAIL_FROM,
    to: email,
    subject: 'AssetFlow ERP - Password Reset Request',
    html
  });
}

/**
 * Send Password Changed Confirmation Email
 */
export async function sendPasswordChangedEmail(email: string, name: string): Promise<void> {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #10b981; margin-bottom: 20px;">Password Changed Successfully</h2>
      <p>Hello ${name},</p>
      <p>This email is to confirm that the password for your AssetFlow ERP account was recently changed.</p>
      <p>If you did this, no further action is required.</p>
      <p style="color: #ef4444; font-weight: bold;">If you did NOT change your password, please reset it immediately or notify your system administrator.</p>
      <hr style="margin: 30px 0; border: 0; border-top: 1px solid #e2e8f0;" />
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">AssetFlow ERP © ${new Date().getFullYear()}</p>
    </div>
  `;

  await transporter.sendMail({
    from: EMAIL_FROM,
    to: email,
    subject: 'AssetFlow ERP - Password Changed Notification',
    html
  });
}
