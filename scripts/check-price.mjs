import { readFile, writeFile } from 'node:fs/promises';

const productUrl = 'https://silpo.ua/product/krevetka-korolivska-syra-defrostovana-40-60-864122';
const statePath = 'data/price-state.json';
const productName = 'Креветка королівська сира дефростована 40/60';

function decodeHtml(value) {
  return value
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

function extractPrices(html) {
  const text = decodeHtml(html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' '));
  const titleIndex = text.toLowerCase().indexOf(productName.toLowerCase());
  if (titleIndex < 0) throw new Error('Could not find the expected product title in the official product page.');

  const excerpt = text.slice(titleIndex, titleIndex + 1800);
  const descriptionIndex = excerpt.indexOf('Опис');
  const priceSection = descriptionIndex >= 0 ? excerpt.slice(0, descriptionIndex) : excerpt.slice(0, 500);
  const priceMatches = [...priceSection.matchAll(/(\d{1,4}[.,]\d{2})\s*грн/gi)]
    .map((match) => Number(match[1].replace(',', '.')))
    .filter((price) => Number.isFinite(price) && price > 0);

  if (!priceMatches.length) throw new Error('Could not extract a price. The store page may have changed.');
  const currentPrice = priceMatches[0];
  const regularPrice = priceMatches.find((price, index) => index > 0 && price > currentPrice) ?? null;

  return {
    currentPrice,
    regularPrice,
    isSale: regularPrice !== null && currentPrice < regularPrice,
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

async function sendEmail(subject, body) {
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

  await transporter.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to: ALERT_EMAIL,
    subject,
    text: body,
  });
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
  if (!response.ok) throw new Error(\`Silpo product page returned HTTP \${response.status}\`);

  const html = await response.text();
  const prices = extractPrices(html);
  const previous = await readPreviousState();
  const now = new Date().toISOString();

  const previousPrice = Number(previous?.currentPrice);
  const priceDropped = previous && Number.isFinite(previousPrice) && previousPrice > 0 && prices.currentPrice < previousPrice;
  const saleStarted = prices.isSale && (!previous || !previous.isSale);
  const shouldAlert = Boolean(priceDropped || saleStarted);

  const state = {
    product: productName,
    productUrl,
    store: 'Сільпо, Фонтанська дорога, 58, Одеса',
    currentPrice: prices.currentPrice,
    regularPrice: prices.regularPrice,
    isSale: prices.isSale,
    lastCheckedAt: now,
    source: 'official Silpo product page',
    storeSpecificAvailability: 'not_verified_by_public_product_page',
  };

  await writeFile(statePath, \`\${JSON.stringify(state, null, 2)}\\n\`);
  console.log(JSON.stringify({ ...state, previousPrice: previous?.currentPrice ?? null, shouldAlert }, null, 2));

  if (shouldAlert) {
    const previousLine = previousPrice > 0 ? \`Предыдущая цена: \${previousPrice} грн / 100 г.\\n\` : '';
    const regularLine = prices.regularPrice ? \`Обычная цена на странице: \${prices.regularPrice} грн / 100 г.\\n\` : '';
    const body = [
      'ShrimpWatch обнаружил изменение цены на креветки!',
      '',
      productName,
      \`Текущая цена: \${prices.currentPrice} грн / 100 г.\`,
      regularLine.trim(),
      previousLine.trim(),
      \`Страница товара: \${productUrl}\`,
      '',
      'Важно: цена взята с публичной страницы Сільпо. Наличие именно в магазине на Фонтанской дороге, 58 отдельно не подтверждено.',
      \`Проверено: \${now}\`,
    ].filter(Boolean).join('\\n');
    await sendEmail('ShrimpWatch: цена на креветки изменилась', body);
  }
}

main().catch((error) => {
  console.error('Price check failed:', error);
  process.exitCode = 1;
});
