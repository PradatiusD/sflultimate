# Donations

`/donate` accepts one-time USD donations using the existing Braintree account. The form and server enforce $5–$250 per transaction. Amounts are stored as integer **USD cents** (25000 = $250.00). This cap is not a daily/card cap: distributed attackers can make separate attempts. Keep Braintree fraud and velocity protections enabled.

## Configuration before deployment

Keep all secrets in the existing environment configuration, never in source control.

- `DONATION_SITE_ORIGIN`: **new, required** exact public origin, with scheme and no trailing slash (for example `https://www.sflultimate.com`). POSTs fail closed when unset or when Origin differs. Use the site's canonical redirect for other hostnames.
- `NEXT_PUBLIC_RECAPTCHA_V2_SITE_KEY`: existing public checkbox key; present at build time.
- `RECAPTCHA_V2_SITE_SECRET`: matching existing checkbox secret. Verification requires the hostname from `DONATION_SITE_ORIGIN`.
- Existing `BRAINTREE_ENV`, `BRAINTREE_MERCHANT_ID`, `BRAINTREE_PUBLIC_KEY`, `BRAINTREE_PRIVATE_KEY`.
- Donations use the existing default Braintree merchant account, like registration. Confirm it is active and configured for USD before launch; the application does not look up or select merchant accounts at runtime.
- Existing `SMTP_USER` and `SMTP_PASSWORD`: Gmail/Nodemailer delivery. Ensure this account can send as `sflultimate@gmail.com`; replies go there.
- Existing Mongo connection. Donation collection indexes are created and awaited before payment requests are accepted. Database credentials need index-creation permission.

Deploy/restart Keystone after adding the Donation list. Before enabling production, verify Braintree sandbox tokenization/payment and SMTP delivery to an authorized test inbox with valid sandbox credentials. Automated tests mock these external services; they do not prove production credentials or email deliverability. Do not run real charges as a test without permission.

## Flow and records

1. Client loads Braintree hosted fields and collects reCAPTCHA.
2. Review modal shows a snapshot of amount, name, email, and message. Cancel does not tokenize or charge. Explicit confirmation generates a unique request ID and a payment nonce.
3. API validates Origin, body, cap, email, and CAPTCHA; Mongo-backed IP rate limits apply across processes (30 client tokens or 10 submissions per ten minutes).
4. Create a pending Donation before charging. Mongo's unique request index makes concurrent repeats use one payment attempt. Braintree receives the Donation ID as `orderId`.
5. Save transaction ID and submitted status before sending email. Never store a nonce, card number, security code, or CAPTCHA token.
6. Send plain-text/escaped-HTML confirmation. SMTP failure records email failure without reversing or retrying payment.

The private Donation list includes `createdAt`, `from`, `message`, `amount`, `email`, payment status/reference, request ID, and email-delivery state. It is read-only in the standard Keystone admin; anonymous reads and GraphQL financial mutations are denied, including development. `from` defaults to Anonymous, but email is still stored privately. The list covers donations through this page only, not existing league-registration donation add-ons.

`submitted` means accepted for processing/settlement, **not final settlement**. Check Braintree for settlement, refunds, and disputes. There are no settlement webhooks in this initial scope. Confirmation is not a charitable tax receipt.

## Interrupted payments

Do not automatically retry a pending or `needsReview` record. Search Braintree using the record ID/order ID (or stored transaction ID). The client preserves only the request ID and amount in local storage and blocks another donation after an ambiguous response or refresh. Support can locate a record using its ID or request ID. If no transaction is visible yet, do not assume it failed; allow for delayed processing and confirm with the processor before authorizing another attempt.

Once an operator has definitively reconciled the payment, clear `sfu-donation-attempt` from the donor browser's local storage to unblock the form. Do not clear this guard just to retry an uncertain payment. No automated payment retry or reconciliation job exists.

## Confirmation email

The successful payment request sends one confirmation using the existing SMTP configuration. Email state is tracked independently of payment. `sent` means SMTP acceptance, not verified inbox delivery. An SMTP or email-status write failure does not retry or reverse a charge.

There is no resend endpoint, delivery lease, queue, or automatic retry. If delivery fails or remains pending after interruption, support should verify the donation in Braintree and respond manually. Never rerun payment to fix email.

## Implementation

`pages/api/donate.js` owns validation, payment sequencing, and confirmation email. Ordinary Donation reads and writes use the existing trusted server GraphQL client and Keystone list. Only the unique request-ID index and shared atomic rate-limit counter use the underlying database directly; these protect concurrent requests across processes. The existing `payment-utils.js` supplies Braintree and CAPTCHA access.

## Tests

Use a supported Node version (verified with Node 22) and local MongoDB on port 27017.

```sh
npm run test:donations
```

This uses real Keystone/Mongo persistence, unique indexes and access control, with mocked Braintree/CAPTCHA/SMTP. It creates and drops only the dedicated `donation_route_test` database on localhost; do not store anything else in that database.

For Cypress, run the app on an isolated empty local database, set `DONATION_SITE_ORIGIN` to match its origin, use dummy/sandbox payment credentials and disable SMTP. The frontend site key must be present; the browser CAPTCHA and payment SDK are mocked by the spec.

```sh
MONGOLAB_URI=mongodb://127.0.0.1:27017/donation_flow_test \
BRAINTREE_ENV=Sandbox BRAINTREE_MERCHANT_ID=test \
BRAINTREE_PUBLIC_KEY=test BRAINTREE_PRIVATE_KEY=test \
SMTP_USER= SMTP_PASSWORD= RECAPTCHA_V2_SITE_SECRET=test \
DONATION_SITE_ORIGIN=http://localhost:3100 PORT=3100 npm run dev

npm run test:donations:e2e -- --config baseUrl=http://localhost:3100,video=false
```

Cypress intercepts browser payment submission, SDK, and CAPTCHA; direct API over-cap and anonymous GraphQL-denial checks hit the real server. No live card charge or real donor email is sent. Tests cover review/cancel, the exact cap, invalid inputs, double clicks, declined payments, email failure, uncertainty across refresh, timeout, modal keyboard behavior, mobile layout, and navigation. Screenshots contain synthetic test data and mocked card fields.

Run `npm run build`, `npm run test:server-graphql`, and `npm run test:stats` as additional checks. Whole-repository lint currently includes generated bundles and unrelated existing errors; lint changed source files separately rather than auto-fixing unrelated files.
