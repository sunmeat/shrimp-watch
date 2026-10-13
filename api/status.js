import { readFile } from 'node:fs/promises';

const stateUrl = new URL('../data/price-state.json', import.meta.url);

export default async function handler(_request, response) {
  response.setHeader('Cache-Control', 'no-store');

  let priceState = null;
  try {
    priceState = JSON.parse(await readFile(stateUrl, 'utf8'));
  } catch {
  }

  response.status(200).json({
    service: 'ShrimpWatch',
    status: priceState?.lastCheckedAt ? 'monitoring-data-available' : 'waiting-for-first-check',
    product: {
      name: 'Королевская креветка сырая, дефростированная 40/60',
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
    priceHistory: Array.isArray(priceState?.priceHistory) ? priceState.priceHistory : [],
    monitoring: {
      scheduledBy: 'GitHub Actions',
      frequency: 'Every 6 hours',
      configured: Boolean(priceState?.lastCheckedAt),
      note: 'The public product page does not confirm store-specific stock.'
    },
    email: {
      configurationLocation: 'GitHub Actions repository secrets',
      note: 'The website cannot determine whether repository secrets are set. Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and ALERT_EMAIL in repository Actions secrets.'
    }
  });
}
