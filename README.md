# ShrimpWatch 🦐

React + Vite dashboard and scheduled price checker for one Silpo product.

## Target
- Store of interest: Сільпо, Фонтанська дорога, 58, Одеса
- Product: Креветка королівська сира дефростована 40/60, 100 г
- Public product page: https://silpo.ua/product/krevetka-korolivska-syra-defrostovana-40-60-864122

## Run the website locally
```bash
npm install
npm run dev
``

Production build: `npm run build`.

## Price watcher
The GitHub Actions workflow `.github/workflows/price-watch.yml` checks the official public product page every six hours and can also be started manually from **Actions → ShrimpWatch price check → Run workflow**.

It stores the latest successful reading in `data/price-state.json`. An email alert is attempted when the public price drops versus the previous reading or a sale is detected. The first run establishes a baseline; if it detects a sale on that first run, it can alert immediately.

### Configure email alerts
In the repository, open **Settings → Secrets and variables → Actions → New repository secret** and add:

- `SMTP_HOST`: your mail provider's SMTP host
- `SMTP_PORT`: usually `465` for SSL or `587` for STARTTLS
- `SMTP_USER`: SMTP login
- `SMTP_PASS`: SMTP password or app password
- `ALERT_EMAIL`: address that should receive alerts
- `SMTP_FROM`: optional sender address; defaults to `SMTP_USER`

For Gmail, the SMTP host is `smtp.gmail.com`; use an app password if your account requires it. Never commit mail credentials or put them in React code.

Make sure repository Actions settings permit workflows to write repository contents, because the scheduled job commits the latest price state. The workflow declares `contents: write`, but an organization/repository policy can still restrict it.

## Important limitations
- The checker reads the **public online product page**, not a verified store-specific inventory feed. It cannot currently confirm whether this item is in stock at Фонтанська дорога, 58.
- If Silpo changes its page markup, parsing fails visibly in the workflow logs instead of guessing a price.
- An email cannot be sent until the SMTP secrets above are configured.
- The form on the React landing page is still a visual demo; it does not collect or save email addresses. The notification recipient is configured privately in GitHub Actions secrets.
- Price checks run on GitHub-hosted infrastructure. Scheduled workflows can start late, so this is periodic monitoring, not an instant real-time alert.

## API status endpoint
When deployed to Vercel, `/api/status` reads the latest committed price state. It is not needed to run the scheduled GitHub Actions checker.
