# CLUBROOM · Legal launch checklist (draft)

**This build is NOT ready for accepting payments.** Subscription integration, confirmation messages and certified CMP require credentials and vendor agreements; no fake success paths.

## Fill in [DOPLNIT]
- Operator legal name, Czech ID number (if any), registered address, contacts, support/privacy email, effective dates and update notices.
- MoR's exact legal entity, contract allocation, final price, currency, billing interval, benefits, trial, club entitlement, refund/cancellation portal, required consumer withdrawal form and confirmation messages.
- Controller / processor inventory, legitimate-interest balancing test for gamertags, retention and deletion schedules, third-country transfers and data subject verification.
- Hosting / CMP / advertising / analytics provider details, their actual cookies, vendors, and retention periods.
- Real production notification endpoint and privacy admin token, operational verification/removal workflow.
- Revalidate the consumer withdrawal text for **digital content vs digital service**. Checkbox wording is a requested draft, not a confirmed legal exception.

## Operating prerequisites
- DATABASE_URL and migrations (otherwise removal requests return HTTP 503, never a false success).
- REMOVAL_WEBHOOK_URL and optional REMOVAL_WEBHOOK_BEARER to notify operator. Without these, requests persist but are NOT automatically notified.
- PRIVACY_ADMIN_TOKEN; approve a verified request via authenticated `POST /api/admin/privacy/removal/:id/approve` with `x-privacy-admin-token` and body `{ "clubId":"..." }`.
- Add player identity verification before approval. Blocking is scoped by club/platform/gamertag and responses are masked. Review third-party data loaded elsewhere and any public data exports.
- Integrate Google-certified CMP with IAB TCF and Consent Mode v2. No optional marketing / analytics scripts are shipped by this change.
- Integrate **verified** server-side MoR checkout with immutable consent logging, versioned text and time tied to payer identity and transaction, signed webhooks, confirmed email and refund/cancel handling. Current checkout deliberately responds HTTP 503.
- Confirm whose consumer relationship applies for merchant-of-record transactions; Czech/EU ADR and warranty provisions should match the actual seller.
- European Commission ODR portal was discontinued July 2025; do not link to defunct portal.

## Rebrand
- CLUBROOM is the app identity; EA SPORTS FC appears only in product description or legally required disclaimer.
- The third-party EA API is still used for statistics (not an EA asset or logo).
- External EA-generated club crests remain possible from third-party data; audit licensing or disable crest display before launch if required.
