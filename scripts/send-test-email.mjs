import nodemailer from 'nodemailer';
import { buildDiscountEmail } from './discount-email.mjs';

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, ALERT_EMAIL } = process.env;
const missing = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'ALERT_EMAIL']
  .filter((key) => !process.env[key]);
if (missing.length) throw new Error(`Missing required GitHub Actions secrets: ${missing.join(', ')}`);

const port = Number(SMTP_PORT);
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port,
  secure: port === 465,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});
await transporter.verify();

const email = buildDiscountEmail({
  productName: 'Королевская креветка сырая, дефростированная 40/60',
  productUrl: 'https://silpo.ua/product/krevetka-korolivska-syra-defrostovana-40-60-864122',
  currentPrice: 39.99,
  regularPrice: 49.99,
  threshold: 40,
  checkedAt: new Date().toISOString(),
});
await transporter.sendMail({
  from: SMTP_FROM || SMTP_USER,
  to: ALERT_EMAIL,
  ...email,
});
console.log('Test email using the exact shared discount-alert template was accepted by the mail server.');
console.log('Recipient:', ALERT_EMAIL);
