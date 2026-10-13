const formatPrice = (value) => value == null
  ? null
  : Number(value).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function buildDiscountEmail({ productName, productUrl, currentPrice, regularPrice, threshold = 40, checkedAt = new Date().toISOString() }) {
  const price = formatPrice(currentPrice);
  const formattedRegularPrice = formatPrice(regularPrice);
  const savings = regularPrice ? Math.round((1 - currentPrice / regularPrice) * 100) : null;
  const subject = `🦐 Есть скидка! Креветки по ${price} грн / 100 г`;
  const checkedAtLabel = new Date(checkedAt).toLocaleString('ru-RU', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Kyiv',
  });
  const text = [
    '🦐 SHRIMPWATCH · КРЕВЕТОЧНАЯ РАЗВЕДКА',
    '',
    'Есть повод заглянуть в морозилку!',
    '',
    productName,
    `Цена сейчас: ${price} грн за 100 г.`,
    formattedRegularPrice ? `Обычная цена: ${formattedRegularPrice} грн за 100 г.` : '',
    savings !== null ? `Экономия: около ${savings}%.` : '',
    '',
    `Цена ниже твоего порога: ${threshold} грн за 100 г.`,
    `Проверено: ${checkedAtLabel} (Киев)`,
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
          ${formattedRegularPrice ? `<div style="font-size:14px;color:#6c6258">Обычная цена: <span style="text-decoration:line-through">${formattedRegularPrice} грн</span></div>` : ''}
          ${savings !== null ? `<div style="display:inline-block;margin-top:10px;background:#dff3d9;color:#27642c;border-radius:20px;padding:6px 10px;font-size:13px;font-weight:bold">Экономия около ${savings}%</div>` : ''}
        </div>
        <p style="font-size:15px;line-height:1.6;margin:0 0 20px">Твой ориентир: <strong>меньше ${threshold} грн за 100 г</strong>. Похоже, пора присмотреться к покупке.</p>
        <a href="${productUrl}" style="display:inline-block;background:#e45b2b;color:#fff;text-decoration:none;font-weight:bold;padding:14px 20px;border-radius:10px">Посмотреть товар ↗</a>
        <p style="font-size:12px;line-height:1.6;color:#777064;margin:24px 0 0">Цена взята с публичной страницы Сильпо. Наличие в конкретном магазине не подтверждено.<br>Проверено: ${checkedAtLabel} (Киев)</p>
      </div>
      <p style="text-align:center;color:#777064;font-size:13px;line-height:1.6;padding:8px 16px">Пусть креветки будут вкусными, а цена одесской!<br><strong>Твоя креветочная разведка 🦐</strong></p>
    </div></body></html>`;

  return { subject, text, html };
}
