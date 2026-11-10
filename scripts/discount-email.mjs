const formatPrice = (value) => value == null
  ? null
  : Number(value).toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function buildDiscountEmail({ productName, productUrl, currentPrice, regularPrice, threshold = 40, checkedAt = new Date().toISOString() }) {
  const price = formatPrice(currentPrice);
  const formattedRegularPrice = formatPrice(regularPrice);
  const savings = regularPrice ? Math.round((1 - currentPrice / regularPrice) * 100) : null;
  const subject = `🦐 Є знижка! Креветки по ${price} грн/100 г`;
  const checkedAtLabel = new Date(checkedAt).toLocaleString('uk-UA', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Kyiv',
  });
  const text = [
    "🦐 SHRIMPWATCH · КРЕВЕТОЧНА РОЗВЕДКА",
    '',
    "Є привід заглянути у морозилку!",
    '',
    productName,
    `Ціна зараз: ${price} грн за 100 г.`,
    formattedRegularPrice ? `Звичайна ціна: ${formattedRegularPrice} грн за 100 г.` : '',
    savings !== null ? `Економія: близько ${savings}%.` : '',
    '',
    `Ціна нижче за твій поріг: ${threshold} грн за 100 г.`,
    `Перевірено: ${checkedAtLabel} (Київ)`,
    '',
    `Відкрити товар: ${productUrl}`,
    '',
    "Примітка: ціна була взята з публічної сторінки Сільпо. Наявність у конкретному магазині не підтверджена.",
    '',
    "Нехай креветки будуть смачними, а ціна одеською!",
    "Твоя розвідка креветок 🦐",
  ].filter(Boolean).join('\n');

  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f4f1eb;font-family:Arial,Helvetica,sans-serif;color:#29251f">
    <div style="max-width:600px;margin:0 auto;padding:28px 16px">
      <div style="background:#20221f;border-radius:18px 18px 0 0;padding:24px 28px;color:#fff">
        <div style="font-size:12px;letter-spacing:2px;color:#ffc48a;font-weight:bold">🦐 SHRIMPWATCH</div>
        <h1 style="margin:12px 0 6px;font-size:28px;line-height:1.2">Є знижка!</h1>
        <p style="margin:0;color:#e5ded4;font-size:15px">Креветкова розвідка повідомляє: ціна впала нижче за твій поріг.</p>
      </div>
      <div style="background:#fff;padding:28px;border-radius:0 0 18px 18px;box-shadow:0 8px 30px #24211b12">
        <p style="margin:0 0 8px;color:#777064;font-size:12px;text-transform:uppercase;letter-spacing:1px">Знайшли за вигідною ціною</p>
        <h2 style="margin:0 0 20px;font-size:21px;line-height:1.35">${productName}</h2>
        <div style="background:#fff4e7;border:1px solid #f5d4ad;border-radius:14px;padding:20px;margin-bottom:18px">
          <div style="font-size:13px;color:#7e5b37">Ціна за 100 г</div>
          <div style="font-size:36px;font-weight:800;color:#b84b20;margin:5px 0">${price} грн</div>
          ${formattedRegularPrice ? `<div style="font-size:14px;color:#6c6258">Звичайна ціна: <span style="text-decoration:line-through">${formattedRegularPrice} грн</span></div>` : ''}
          ${savings !== null ? `<div style="display:inline-block;margin-top:10px;background:#dff3d9;color:#27642c;border-radius:20px;padding:6px 10px;font-size:13px;font-weight:bold">Економія близько ${savings}%</div>` : ''}
        </div>
        <p style="font-size:15px;line-height:1.6;margin:0 0 20px">Твій орієнтир: <strong>менше ${threshold} грн за 100 г</strong>. Схоже, настав час придивитися до покупки.</p>
        <a href="${productUrl}" style="display:inline-block;background:#e45b2b;color:#fff;text-decoration:none;font-weight:bold;padding:14px 20px;border-radius:10px">Переглянути товар ↗</a>
        <p style="font-size:12px;line-height:1.6;color:#777064;margin:24px 0 0">Ціна була взята з публічної сторінки Сільпо. Наявність у конкретному магазині не підтверджена.<br>Перевірено: ${checkedAtLabel} (Київ)</p>
      </div>
      <p style="text-align:center;color:#777064;font-size:13px;line-height:1.6;padding:8px 16px">Нехай креветки будуть смачними, а ціна одеською!<br><strong>Твоя розвідка креветок 🦐</strong></p>
    </div></body></html>`;

  return { subject, text, html };
}
