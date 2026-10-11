export default function handler(_request, response) {
  response.setHeader('Cache-Control', 'no-store');
  response.status(200).json({
    service: 'ShrimpWatch',
    status: 'prototype',
    store: {
      name: 'Сільпо',
      address: 'Фонтанська дорога, 58, Одеса',
      mapsUrl: 'https://maps.app.goo.gl/njf9mi7c1E47czieA'
    },
    product: {
      name: 'Креветка королівська, сира, дефростована, 40/60',
      unit: '100 г'
    },
    monitoring: {
      configured: false,
      reason: 'A reliable live price source and scheduled server-side checks have not been connected yet.'
    },
    email: {
      configured: false,
      reason: 'A mail provider and recipient settings have not been configured yet.'
    }
  });
}
