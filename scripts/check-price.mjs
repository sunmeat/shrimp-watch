import { readFile, writeFile } from 'node:fs/promises';
import { buildDiscountEmail } from './discount-email.mjs';

const productUrl = 'https://silpo.ua/product/krevetka-korolivska-syra-defrostovana-40-60-864122';
const statePath = 'data/price-state.json';
const alertPriceThreshold = 40;
const productName = 'Креветка королівська сира дефростована 40/60';
const productNameVariants = ['Креветка королівська сира дефростована 40/60', 'Креветка королівська сира, дефростована 40/60', 'Креветка королівська сира дефростована 40/60 100г'];

function decodeHtml(value) {
  return value
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

function extractPrices(html) {
  const clean = decodeHtml(html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' '));
  const lower = clean.toLocaleLowerCase('uk-UA');
  const titleIndex = productNameVariants
    .map((name) => lower.indexOf(name.toLocaleLowerCase('uk-UA')))
    .find((index) => index >= 0);
  const excerpt = titleIndex >= 0 ? clean.slice(titleIndex, titleIndex + 2400) : clean.slice(0, 8000);

  const offers = [...html.matchAll(/"price"\s*:\s*"?([0-9]+(?:[.,][0-9]{1,2})?)"?/gi)]
    .map((match) => Number(match[1].replace(',', '.')))
    .filter((price) => Number.isFinite(price) && price > 0 && price < 100000);
  const priceMatches = [...excerpt.matchAll(/([0-9]{1,4}[.,][0-9]{2})\s*(?:грн|₴)/gi)]
    .map((match) => Number(match[1].replace(',', '.')))
    .filter((price) => Number.isFinite(price) && price > 0);

  const prices = priceMatches.length ? priceMatches : offers;
  if (!prices.length) throw new Error('Не удалось найти цену товара в HTML/JSON-LD страницы. Старое состояние цены сохранено.');

  const currentPrice = prices[0];
  const regularPrice = prices.find((price, index) => index > 0 && price > currentPrice) ?? null;
  return { currentPrice, regularPrice, isSale: regularPrice !== null && currentPrice < regularPrice };
}

async function readPreviousState() {
  try {
    return JSON.parse(await readFile(statePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function sendEmail(subject, body, html) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ALERT_EMAIL, SMTP_FROM } = process.env;
  if (![SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ALERT_EMAIL].every(Boolean)) {
    console.log('Email skipped: configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and ALERT_EMAIL GitHub Actions secrets.');
    return false;
  }

  const nodemailer = (await import('nodemailer')).default;
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  await transporter.sendMail({ from: SMTP_FROM || SMTP_USER, to: ALERT_EMAIL, subject, text: body, html });
  console.log('Discount email sent.');
  return true;
}

async function main() {
  const response = await fetch(productUrl, {
    headers: {
      'user-agent': 'ShrimpWatch/1.0 (price monitoring; contact repository owner)',
      accept: 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`Silpo product page returned HTTP ${response.status}`);

  const html = await response.text();
  const prices = extractPrices(html);
  const previous = await readPreviousState();
  const now = new Date().toISOString();
  const previousPrice = Number(previous?.currentPrice);
  const belowThreshold = prices.currentPrice < alertPriceThreshold;
  const wasBelowThreshold = Number.isFinite(previousPrice) && previousPrice > 0 && previousPrice < alertPriceThreshold;
  const shouldAlert = belowThreshold && (!wasBelowThreshold || previous?.alertEmailSent !== true);

  const previousHistory = Array.isArray(previous?.priceHistory) ? previous.priceHistory : [];
  const priceHistory = [
    ...previousHistory,
    { priceUah: prices.currentPrice, checkedAt: now },
  ].slice(-180);

  const state = {
    product: productName,
    productUrl,
    currentPrice: prices.currentPrice,
    regularPrice: prices.regularPrice,
    isSale: prices.isSale,
    alertPriceThreshold,
    belowThreshold,
    alertEmailSent: belowThreshold && wasBelowThreshold ? previous?.alertEmailSent === true : false,
    lastCheckedAt: now,
    priceHistory,
    source: 'official Silpo product page',
    storeSpecificAvailability: 'not_verified_by_public_product_page',
  };
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`);
  console.log(JSON.stringify({ ...state, previousPrice: previous?.currentPrice ?? null, shouldAlert }, null, 2));

  if (shouldAlert) {
    const email = buildDiscountEmail({
      productName,
      productUrl,
      currentPrice: prices.currentPrice,
      regularPrice: prices.regularPrice,
      threshold: alertPriceThreshold,
      checkedAt: now,
    });
    state.alertEmailSent = await sendEmail(email.subject, email.text, email.html);
    await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`);
  }
}

main().catch((error) => {
  console.error('Price check failed:', error);
  process.exitCode = 1;
});
