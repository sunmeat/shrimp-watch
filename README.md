# ShrimpWatch 🦐

React + Vite interface for a small shrimp-price watch project.

## Target
- Store: Сільпо, Фонтанська дорога, 58, Одеса
- Product: Креветка королівська, сира, дефростована, 40/60

## Run locally
```bash
npm install
npm run dev
``

Create a production build with `npm run build`.

## Current status
The current commit contains the responsive React landing page, dancing shrimp animation, target product/store details, and a demo email form.

**Price monitoring and email delivery are not connected yet.** The displayed 69.90 UAH per 100 g is a last-known reference, not a live verified price. The email form currently only demonstrates the interface and does not transmit or persist addresses. The next implementation step is to connect a reliable Silpo product/price source, a scheduled server-side check, and a mail provider using environment variables. Store-specific availability must not be inferred from a general product page.

Do not put API keys, SMTP passwords, or recipient addresses in frontend code.
