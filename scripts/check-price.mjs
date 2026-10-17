import { readFile, writeFile } from 'node:fs/promises';
import { buildDiscountEmail } from './discount-email.mjs';

const productUrl = 'https://silpo.ua/product/krevetka-korolivska-syra-defrostovana-40-60-864122';
const catalogApiUrl = 'https://api.catalog.ecom.silpo.ua/api/2.0/exec/EcomCatalogGlobal';
const filialId = process.env.SILPO_FILIAL_ID || '2405';
const statePath = 'data/price-state.json';
const alertPriceThreshold = 40;
const productName = 'Королевская креветка сырая, дефростированная 40/60';
const productNameVariants = [
  'Креветка королівська сира дефростована 40/60',
  'Креветка королівська сира, дефростована 40/60',
  'Креветка королівська сира дефростована 40/60 100г',
];

const browserHeaders = {
  'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  accept: 'application/json, text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'accept-language': 'uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7',
};

function decodeHtml(value) {
  return value
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

function parseMoney(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const normalized = value.replace(/\s/g, '').replace(',', '.').replace(/грн|₴/gi, '');
  const match = normalized.match(/\d+(?:\.\d{1,2})?/);
  if (!match) return null;
  const price = Number(match[0]);
  return Number.isFinite(price) && price > 0 && price < 100000 ? price : null;
}

function productMatches(value) {
  if (typeof value !== 'string') return false;
  const normalized = value.toLocaleLowerCase('uk-UA').replace(/[.,]/g, ' ').replace(/\s+/g, ' ');
  return productNameVariants.some((name) => {
    const target = name.toLocaleLowerCase('uk-UA').replace(/[.,]/g, ' ').replace(/\s+/g, ' ');
    return normalized.includes(target);
  });
}

function walkObjects(value, visit) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) walkObjects(item, visit);
    return;
  }
  visit(value);
  for (const child of Object.values(value)) walkObjects(child, visit);
}

function getFieldValue(object, names) {
  const wanted = new Set(names.map((name) => name.toLowerCase()));
  let found = null;
  walkObjects(object, (item) => {
    if (found !== null) return;
    for (const [key, value] of Object.entries(item)) {
      if (wanted.has(key.toLowerCase())) {
        const parsed = parseMoney(value);
        if (parsed !== null) {
          found = parsed;
          return;
        }
      }
    }
  });
  return found;
}

function extractCatalogProduct(data) {
  const matches = [];
  walkObjects(data, (item) => {
    const directStrings = Object.entries(item)
      .filter(([, value]) => typeof value === 'string')
      .map(([, value]) => value);
    if (directStrings.some(productMatches)) matches.push(item);
  });

  if (!matches.length) {
    throw new Error(`Silpo catalog API did not return the target product. Top-level keys: ${Object.keys(data ?? {}).join(', ') || 'none'}`);
  }

  for (const product of matches) {
    const currentPrice = getFieldValue(product, [
      'displayPrice', 'priceWithDiscount', 'discountPrice', 'salePrice',
      'specialPrice', 'currentPrice', 'price',
    ]);
    if (currentPrice === null) continue;
    const regularPrice = getFieldValue(product, [
      'displayOldPrice', 'oldPrice', 'regularPrice', 'priceWithoutDiscount',
      'originalPrice', 'basePrice',
    ]);
    return {
      currentPrice,
      regularPrice: regularPrice !== null && regularPrice > currentPrice ? regularPrice : null,
      isSale: regularPrice !== null && currentPrice < regularPrice,
    };
  }

  throw new Error('Silpo catalog API returned the target product, but no recognizable price field was found.');
}

async function fetchCatalogPrice() {
  const response = await fetch(catalogApiUrl, {
    method: 'POST',
    headers: { ...browserHeaders, 'content-type': 'application/json;charset=UTF-8', origin: 'https://silpo.ua', referer: 'https://silpo.ua/' },
    body: JSON.stringify({
      method: 'GetSimpleCatalogItems',
      data: {
        customFilter: 'Креветка королівська сира дефростована 40/60',
        filialId,
        skuPerPage: 100,
        pageNumber: 1,
      },
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`Silpo catalog API returned HTTP ${response.status}`);
  const data = await response.json();
  return extractCatalogProduct(data);
}

function extractPricesFromHtml(html) {
  const decodeText = (value) => decodeHtml(value
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' '));

  const clean = decodeText(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' '));
  const lower = clean.toLocaleLowerCase('uk-UA');
  const titleIndexes = productNameVariants
    .map((name) => lower.indexOf(name.toLocaleLowerCase('uk-UA')))
    .filter((index) => index >= 0);
  const titleIndex = titleIndexes.length ? Math.min(...titleIndexes) : -1;

  if (titleIndex < 0) {
    throw new Error('Название нужного товара не найдено на странице.');
  }

  const excerpt = clean.slice(titleIndex, titleIndex + 4000);
  const visiblePrices = [...excerpt.matchAll(/([0-9]{1,4}[.,][0-9]{2})\s*(?:грн|₴)/gi)]
    .map((match) => Number(match[1].replace(',', '.')))
    .filter((price) => Number.isFinite(price) && price > 0 && price < 100000);

  const candidates = [...new Set(visiblePrices)].sort((a, b) => a - b);
  if (!candidates.length) throw new Error('Не удалось найти цену рядом с названием товара.');
  const currentPrice = candidates[0];
  const regularPrice = candidates.find((price) => price > currentPrice) ?? null;
  return { currentPrice, regularPrice, isSale: regularPrice !== null && currentPrice < regularPrice };
}

async function getCurrentPrice() {
  try {
    const prices = await fetchCatalogPrice();
    console.log('Price source: Silpo public catalog API.');
    return { ...prices, source: `Silpo public catalog API (filial ${filialId})` };
  } catch (apiError) {
    console.warn(`Catalog API unavailable: ${apiError.message}`);
  }

  try {
    const proxyUrl = `https://r.jina.ai/http://${productUrl.replace('https://', '')}`;
    const response = await fetch(proxyUrl, {
      headers: { accept: 'text/plain', 'user-agent': 'ShrimpWatch/1.0' },
      signal: AbortSignal.timeout(25000),
    });
    if (!response.ok) throw new Error(`Reader proxy returned HTTP ${response.status}`);
    const text = await response.text();
    const prices = extractPricesFromHtml(text);
    console.log('Price source: Silpo page via text-reader proxy.');
    return { ...prices, source: 'Silpo product page via text-reader proxy' };
  } catch (proxyError) {
    console.warn(`Reader proxy unavailable: ${proxyError.message}`);
  }

  const response = await fetch(productUrl, {
    headers: { ...browserHeaders, referer: 'https://silpo.ua/' },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`Catalog API and reader proxy failed; Silpo product page returned HTTP ${response.status}`);
  const prices = extractPricesFromHtml(await response.text());
  console.log('Price source: Silpo product page fallback.');
  return { ...prices, source: 'official Silpo product page' };
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
  const prices = await getCurrentPrice();
  const previous = await readPreviousState();
  const now = new Date().toISOString();
  const previousPrice = Number(previous?.currentPrice);
  const belowThreshold = prices.currentPrice < alertPriceThreshold;
  const wasBelowThreshold = Number.isFinite(previousPrice) && previousPrice > 0 && previousPrice < alertPriceThreshold;
  const shouldAlert = belowThreshold && (!wasBelowThreshold || previous?.alertEmailSent !== true);

  const previousHistory = Array.isArray(previous?.priceHistory) ? previous.priceHistory : [];
  const priceHistory = [...previousHistory, { priceUah: prices.currentPrice, checkedAt: now }].slice(-180);

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
    source: prices.source,
    storeSpecificAvailability: 'not_verified_by_public_catalog',
  };
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
  }

  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`);
}

main().catch((error) => {
  console.error('Price check failed:', error);
  process.exitCode = 1;
});
