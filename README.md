# BAATO

Nepal vehicle-parts desk. The catalog is a typed price list. Checkout writes orders to Postgres, prices them on the server, and issues a Nepal-style PDF bill in memory.

Cash on delivery works with no payment keys. eSewa, Khalti, and Fonepay appear at checkout only when their environment variables are set.

## Run

```bash
npm install
npm run dev
```

The dev server listens on port 8080. Without `DATABASE_URL`, orders are stored in embedded Postgres for that process and reset when the process stops. Set `DATABASE_URL` to a Neon (or any Postgres) URL to keep them. `npm run build` applies `migrations/*.sql` when that URL is present.

## Before going live

Set these in the host environment. Names and purpose are listed in `.env.example`.

- `DATABASE_URL` — Postgres connection string
- `APP_ORIGIN` — public `https` origin, no trailing slash (payment return URLs)
- `SELLER_LEGAL_NAME`, `SELLER_ADDRESS`, `SELLER_PAN`, `SELLER_PHONE` — printed on every bill. PAN is 9 digits
- `WHATSAPP_E164` — Nepal mobile for the fitment and order buttons
- `ESEWA_PRODUCT_CODE`, `ESEWA_SECRET_KEY`, `ESEWA_ENV` (`uat` or `prod`)
- `KHALTI_SECRET_KEY`, `KHALTI_ENV`
- `FONEPAY_MERCHANT_CODE`, `FONEPAY_USERNAME`, `FONEPAY_PASSWORD`, `FONEPAY_SECRET`, `FONEPAY_ENV`
- `FONEPAY_WEBHOOK_SECRET` — only if something will `POST /api/payments/fonepay` with header `x-baato-webhook-secret`
- `ADMIN_SECRET` (or `ADMIN_PASSWORD`) — password for `/admin`. Leave unset and the desk shows a setup notice instead of opening

None of these use a `VITE_` prefix, so they are not shipped to the browser.

## Admin desk

`/admin` lists orders and the parts cage.

1. Set `ADMIN_SECRET` to a long random string in the server environment. `ADMIN_PASSWORD` is accepted if `ADMIN_SECRET` is empty.
2. Restart the server.
3. Open `/admin` and sign in. The session is an HTTP-only cookie signed with that secret, for 12 hours.

Without the secret, `/admin` explains how to set it and does not show orders or stock. The page is `noindex`, and `robots.txt` disallows `/admin` and `/api`.

Order filters are pending, confirmed, paid, dispatched, delivered, and cancelled. Search matches an order code (`BT-1001`) or the mobile number from checkout. Cash-on-delivery orders can be marked paid from the desk, which issues the tax invoice. Wallet orders become paid only after the payment check.

Stock saved on the desk is what checkout will sell. Turning a part off keeps the quantity and blocks new orders. Placing an order decrements that quantity.

## Checkout

Delivery fees (VAT-inclusive):

- Kathmandu Valley: NPR 150, free from NPR 5,000
- Outside Valley: NPR 350, free from NPR 15,000

Shelf prices are VAT-inclusive NPR. The bill backs 13% out of the total (`round(total × 13 / 113)` in paisa). Amounts are stored as integer paisa. Line prices are copied from `src/lib/catalog.ts` at order time.

Order codes look like `BT-1001`. Tax invoices look like `BT-83/84-000001` and use a counter row locked inside the payment transaction. The fiscal year starts 16 July, Kathmandu time. COD orders get a proforma (`PF-BT-1001`) immediately. A tax invoice is issued only after `verifyAndCapture` has checked the provider status and the amount.

Customers open an order with the code plus the mobile number used at checkout. No account.

## Payments

`verifyAndCapture` is idempotent on `(provider, provider_ref)`. A browser redirect never marks an order paid by itself.

- **COD** — status `cod_confirmed`, payment unpaid, proforma PDF
- **eSewa ePay v2** — server HMAC-SHA256 over `total_amount,transaction_uuid,product_code`, browser POST to eSewa, then the return route calls eSewa's status API
- **Khalti** — server `initiate`, store `pidx`, redirect to `payment_url`, return route calls `lookup`. Only `Completed` captures. Amount is paisa
- **Fonepay** — server requests a dynamic QR tied to a PRN and the order amount (HMAC-SHA512). The order page shows the QR and polls the status API. The websocket message only triggers that poll. `POST /api/payments/fonepay` does the same check when `FONEPAY_WEBHOOK_SECRET` matches

Fonepay's status response does not echo the amount. The PRN was signed with the amount we charged, and capture still requires that stored amount to equal the order total. If the status body includes `amount`, that value has to match too.

A PDF is generated when someone downloads it. It is not written to disk.
