import { readFile } from 'node:fs/promises';

const stateUrl = new URL('../data/price-state.json', import.meta.url);

export default async function handler(_request, response) {
  response.setHeader('Cache-Control', 'no-store');

  let priceState = null;
  try {
    priceState = JSON.parse(await readFile(stateUrl, 'utf8'));
  } catch {
    // The monitor may not have completed its first successful run yet.
  }

  response.status(200).json({
    service: 'ShrimpWatch',
    status: priceState?.lastCheckedAt ? 'monitoring-data-available' : 'waiting-for-first-check',
    store: {
      name: 'Сільпо',
      address: 'Фонтанська дорога, 58, Одеса',
      mapsUrl: 'https://maps.app.goo.gl/njf9mi7c1E47czieA'
    },
    product: {
      name: 'Креветка королівська, сира, дефростована, 40/60',
      unit: '100 г',
      url: 'https://silpo.ua/product/krevetka-korolivska-syra-defrostovana-40-60-864122'
    },
    latestCheck: priceState ? {
      priceUah: priceState.currentPrice,
      regularPriceUah: priceState.regularPrice,
      isSale: priceState.isSale,
      checkedAt: priceState.lastCheckedAt,
      source: priceState.source,
      storeSpecificAvailability: priceState.storeSpecificAvailability
    } : null,
    monitoring: {
      scheduledBy: 'GitHub Actions',
      frequency: 'Every 6 hours',
      configured: Boolean(priceState?.lastCheckedAt),
      note: 'The public product page does not confirm stock in the selected physical store.'
    },
    email: {
      configuredInGitHubActions: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.ALERT_EMAIL),
      note: 'Email credentials are configured as GitHub Actions secrets, not in this frontend.'
    }
  });
}
