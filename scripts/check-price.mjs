import { readFile, writeFile } from 'node:fs/promises';
import { buildDiscountEmail } from './discount-email.mjs';

const productUrl = 'https://silpo.ua/product/krevetka-korolivska-syra-defrostovana-40-60-864122';
const catalogApiUrl = 'https://api.catalog.ecom.silpo.ua/api/2.0/exec/EcomCatalogGlobal';
const filialId = process.env.SILPO_FILIAL_ID || '2405';
const statePath = 'data/price-state.json';
const alertPriceThreshold = 40;
const productName = "Королівська креветка сира, дефростована 40/60";
const productNameVariants = [
  "Креветка королівська сира дефростована 40/60",
  "Креветка королівська сира, дефростована 40/60",
  "Креветка королівська сира дефростована 40/60 100г",
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
        customFilter: "Креветка королівська сира дефростована 40/60",
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
  // Reader proxy yields Markdown, whereas Silpo itself returns HTML.
  // Anchor to the exact product heading and stop before recommendations.
  const normalized = decodeHtml(html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' '));
  // HTML tags have already been stripped, so do not require Markdown heading markers.
  const titlePattern = /креветка\s+королівська\s+сира[, ]+\s*дефростована\s+40\/60(?:,\s*100\s*г)?/i;
  const title = titlePattern.exec(normalized);
  if (!title) throw new Error('Target product heading was not found in product page.');
  const nearby = normalized.slice(title.index + title[0].length, title.index + title[0].length + 180);
  const prices = [...nearby.matchAll(/(\d{1,4}[.,]\d{2})\s*(?:грн|₴)/gi)]
    .map(match => Number(match[1].replace(',', '.')))
    .filter(price => price > 0 && price < 1000);
  if (!prices.length) throw new Error('No selling price found next to product heading.');
  const currentPrice = prices[0];
  const regularPrice = prices.slice(1).find(price => price > currentPrice) ?? null;
  return { currentPrice, regularPrice, isSale: regularPrice !== null };
}

async function getCurrentPrice() {
  // Prefer the exact product page. Catalog search can return other variants or stale prices.
  try {
    const response = await fetch(productUrl, {
      headers: { ...browserHeaders, referer: 'https://silpo.ua/' },
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const prices = extractPricesFromHtml(await response.text());
    return { ...prices, source: 'official Silpo product page' };
  } catch (error) {
    console.warn(`Official product page unavailable: ${error.message}`);
  }

  try {
    const proxyUrl = `https://r.jina.ai/http://${productUrl.replace('https://', '')}`;
    const response = await fetch(proxyUrl, {
      headers: { accept: 'text/plain', 'user-agent': 'ShrimpWatch/1.0' },
      signal: AbortSignal.timeout(25000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const proxyBody = await response.text();
    console.log(`Reader proxy response: ${proxyBody.slice(0, 500).replace(/\s+/g, ' ')}`);
    if (/Title:\s*(?:404|403|Not Found|Access Denied)|Warning:\s*Target URL returned error/i.test(proxyBody)) {
      throw new Error('Reader proxy returned an upstream error, not a product listing.');
    }
    const prices = extractPricesFromHtml(proxyBody);
    return { ...prices, source: 'Silpo product page via text-reader proxy' };
  } catch (error) {
    console.warn(`Reader proxy unavailable: ${error.message}`);
  }

  try {
    return await fetchForlyPrice();
  } catch (error) {
    console.warn('Forly reference unavailable: ' + error.message);
  }

  // Catalog is a last resort: prices can differ by filial.
  try {
    const prices = await fetchCatalogPrice();
    return { ...prices, source: `Silpo public catalog API (filial ${filialId})` };
  } catch (error) {
    throw new Error(`All price sources failed; last catalog error: ${error.message}. No stale price will be written.`);
  }
}


async function fetchForlyPrice() {
  // Independent public listing. This is a Kyiv reference price, not Odesa stock verification.
  const url = 'https://forly.club/product/krevetka-korolivska-syra-defrostovana-40-60-eyy201-01m6z4dnjjqz69f83m0ceyy201?chain=silpo';
  const response = await fetch(url, {
    headers: {
      'user-agent': browserHeaders['user-agent'],
      accept: 'text/html,application/xhtml+xml',
      'accept-language': browserHeaders['accept-language'],
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error('Forly HTTP ' + response.status);
  const html = await response.text();
  const text = decodeHtml(html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' '));
  const title = 'Креветка королівська сира дефростована 40/60';
  const pos = text.toLocaleLowerCase('uk-UA').indexOf(title.toLocaleLowerCase('uk-UA'));
  if (pos < 0) throw new Error('Forly target product title not found; sample: ' + text.slice(0, 250));
  const scope = text.slice(pos, pos + 4000);
  const priceArea = scope.indexOf('Ціна зараз');
  if (priceArea < 0) throw new Error('Forly price section missing; sample: ' + scope.slice(0, 350));
  const area = scope.slice(priceArea, priceArea + 850);
  if (!/Сільпо/i.test(area)) throw new Error('Forly store does not match Silpo');
  const unit = /(\d[\d\s\u00a0\u202f]*[.,]\d{2})\s*₴\s*\/\s*кг/i.exec(area);
  if (!unit) throw new Error('Forly unit price not found; sample: ' + area.slice(0, 450));
  const perKg = parseMoney(unit[1]);
  if (!(perKg > 0)) throw new Error('Forly invalid per-kg price');
  const stamp = /перевірено\s+(\d{2})\.(\d{2})\.(\d{4})\s+о\s+(\d{2}):(\d{2})/i.exec(area);
  if (!stamp) throw new Error('Forly missing source verification date; sample: ' + area.slice(0, 450));
  const [, dd, mm, yyyy, hh, minute] = stamp;
  const checkedAt = new Date(yyyy + '-' + mm + '-' + dd + 'T' + hh + ':' + minute + ':00+02:00').toISOString();
  const age = Date.now() - Date.parse(checkedAt);
  if (age < -3600000 || age > 48 * 3600000) {
    throw new Error('Forly price too old or future-dated: ' + checkedAt);
  }
  const old = /було\s+(\d[\d\s\u00a0\u202f]*[.,]\d{2})\s*₴/i.exec(area);
  const oldPerKg = old ? parseMoney(old[1]) : null;
  const currentPrice = Math.round(perKg * 10) / 100;
  const regularPrice = oldPerKg > perKg ? Math.round(oldPerKg * 10) / 100 : null;
  console.log('Forly verified price', JSON.stringify({ currentPrice, regularPrice, checkedAt, market: 'Kyiv' }));
  return {
    currentPrice, regularPrice, isSale: regularPrice !== null,
    source: 'Forly.club Silpo listing (Kyiv reference)',
    observedAt: checkedAt,
    priceScope: 'reference_kyiv',
    storeSpecificAvailability: 'not_verified_for_odesa',
  };
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
  const shouldAlert = prices.priceScope !== 'reference_kyiv' && belowThreshold && (!wasBelowThreshold || previous?.alertEmailSent !== true);

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
    observedAt: prices.observedAt ?? now,
    priceScope: prices.priceScope ?? 'unverified_store_stock',
    storeSpecificAvailability: prices.storeSpecificAvailability ?? 'not_verified_by_public_catalog',
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
