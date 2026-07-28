export {
  SUPPORT_EMAIL,
  SUPPORT_EMAIL_NAME,
  getEmailFromAddress,
  getEmailFromName,
  getEmailFromHeader,
  getEmailReplyTo,
  isAppMailerConfigured,
} from '@/lib/email/config';

export { sendAppEmail, type SendAppEmailInput, type SendAppEmailResult } from '@/lib/email/mailer';
