import { readFile, writeFile } from 'node:fs/promises';

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

  // Prefer product-specific JSON-LD offers when the page includes structured data.
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
  // Retry on the next hourly run if an alert was needed but email delivery was not configured or failed.
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
    const price = prices.currentPrice.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const regularPrice = prices.regularPrice?.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const savings = prices.regularPrice ? Math.round((1 - prices.currentPrice / prices.regularPrice) * 100) : null;
    const subject = `🦐 Есть скидка! Креветки по ${price} грн / 100 г`;
    const checkedAt = new Date(now).toLocaleString('ru-RU', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Kyiv' });
    const body = [
      '🦐 SHRIMPWATCH · КРЕВЕТОЧНАЯ РАЗВЕДКА',
      '',
      'Есть повод заглянуть в морозилку!',
      '',
      productName,
      `Цена сейчас: ${price} грн за 100 г.`,
      regularPrice ? `Обычная цена: ${regularPrice} грн за 100 г.` : '',
      savings !== null ? `Экономия: около ${savings}%.` : '',
      '',
      `Цена ниже твоего порога: ${alertPriceThreshold} грн за 100 г.`,
      `Проверено: ${checkedAt} (Киев)`,
      '',
      `Открыть товар: ${productUrl}`,
      '',
      'Примечание: цена взята с публичной страницы Сильпо. Наличие в конкретном магазине не подтверждено.',
      '',
      'Пусть креветки будут вкусными, а цена одесской!',
      'Твоя креветочная разведка 🦐',
    ].filter(Boolean).join('\n');
    const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f4f1eb;font-family:Arial,Helvetica,sans-serif;color:#29251f">
      <div style="max-width:600px;margin:0 auto;padding:28px 16px">
        <div style="background:#20221f;border-radius:18px 18px 0 0;padding:24px 28px;color:#fff">
          <div style="font-size:12px;letter-spacing:2px;color:#ffc48a;font-weight:bold">🦐 SHRIMPWATCH</div>
          <h1 style="margin:12px 0 6px;font-size:28px;line-height:1.2">Есть скидка!</h1>
          <p style="margin:0;color:#e5ded4;font-size:15px">Креветочная разведка докладывает: цена упала ниже твоего порога.</p>
        </div>
        <div style="background:#fff;padding:28px;border-radius:0 0 18px 18px;box-shadow:0 8px 30px #24211b12">
          <p style="margin:0 0 8px;color:#777064;font-size:12px;text-transform:uppercase;letter-spacing:1px">Нашли по выгодной цене</p>
          <h2 style="margin:0 0 20px;font-size:21px;line-height:1.35">${productName}</h2>
          <div style="background:#fff4e7;border:1px solid #f5d4ad;border-radius:14px;padding:20px;margin-bottom:18px">
            <div style="font-size:13px;color:#7e5b37">Цена за 100 г</div>
            <div style="font-size:36px;font-weight:800;color:#b84b20;margin:5px 0">${price} грн</div>
            ${regularPrice ? `<div style="font-size:14px;color:#6c6258">Обычная цена: <span style="text-decoration:line-through">${regularPrice} грн</span></div>` : ''}
            ${savings !== null ? `<div style="display:inline-block;margin-top:10px;background:#dff3d9;color:#27642c;border-radius:20px;padding:6px 10px;font-size:13px;font-weight:bold">Экономия около ${savings}%</div>` : ''}
          </div>
          <p style="font-size:15px;line-height:1.6;margin:0 0 20px">Твой ориентир: <strong>меньше ${alertPriceThreshold} грн за 100 г</strong>. Похоже, пора присмотреться к покупке.</p>
          <a href="${productUrl}" style="display:inline-block;background:#e45b2b;color:#fff;text-decoration:none;font-weight:bold;padding:14px 20px;border-radius:10px">Посмотреть товар ↗</a>
          <p style="font-size:12px;line-height:1.6;color:#777064;margin:24px 0 0">Цена взята с публичной страницы Сильпо. Наличие в конкретном магазине не подтверждено.<br>Проверено: ${checkedAt} (Киев)</p>
        </div>
        <p style="text-align:center;color:#777064;font-size:13px;line-height:1.6;padding:8px 16px">Пусть креветки будут вкусными, а цена одесской!<br><strong>Твоя креветочная разведка 🦐</strong></p>
      </div></body></html>`;
    state.alertEmailSent = await sendEmail(subject, body, html);
    await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`);
  }
}

main().catch((error) => {
  console.error('Price check failed:', error);
  process.exitCode = 1;
});
