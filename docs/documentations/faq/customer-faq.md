---
id: customer-faq
title: Customer FAQ
---

# Frequently asked questions

## Customer Question  (FAQ)

#### Q: How do we get a transaction working with the SDK?

1. <a href="https://go.developerportal.qa.haloplus.ioo/" target="_blank">Register a developer</a> account with Halo, this will give you AWS credentials to access the maven repository
2. [Then access the SDK](/docs/documentations/sdk/getting-started-with-sdk)
3. [Programmatically initialize the SDK](/docs/documentations/sdk/sdk-integration-guide#6-initialization-of-the-sdk)
4. [Start a transaction](/docs/documentations/sdk/sdk-integration-guide#7-transaction-flow)
   1. `val result = HaloSDK.startTransaction(amount, reference)`
5. [See the life cycle of the SDK](/docs/documentations/sdk/sdk-integration-guide#5-life-cycle-methods)

#### Q: How do refund work?
A: The refund transaction is a transaction that is refunded after it is settled. The funds are sent back to the cardholder’s account. [see](/docs/documentations/api-docs/refunds#refund)

#### Q: How do reversal work?
A: The reversal transaction is a transaction that is reversed before it is settled. No money is moved. Typically used within the same day or session. [see](/docs/documentations/api-docs/refunds#reversal)

#### Q: How do void transaction work?
A: The void transaction is a transaction that is voided before it is settled. No money is moved. Typically used within the same day or session. [see](/docs/documentations/api-docs/refunds#void)

#### Q: What is the difference between Deep Link and Intent based integration?
A: An intent transaction is an app-to-app transaction between us and a third party app transacting through us to a payment provider.<br/>
Deep link transaction involves the generation of a QrCode that can be scanned to open the Halo app for payment.

#### Q: What is Scan to Tap?
A: Available on the <a href="https://go.merchantportal.qa.haloplus.io/" target="_blank">merchant portal</a> it uses deep links to generate a QrCode that can be scanned to open the Halo app for payment.

#### Q: What is Tap on own?
A: Available on the <a href="https://go.merchantportal.qa.haloplus.io/" target="_blank">merchant portal</a> allows you to integrate a checkout system in your eCommerce store.

#### Q: What is Push to Pay?
A: Available on the <a href="https://go.merchantportal.qa.haloplus.io/" target="_blank">merchant portal</a> allows you to link your device to the Halo app for payment.

#### Q: What are the reporting requirements?
- Master Card:
  - Reports must mention Acquirer and Solution Developer Name – Nedbank & Synthesis
  - Number of total devices enabled (cumulative across all months of Pilot activity). Synthesis
  - The number of new devices enabled each month. The number of active merchants each month (processing at least one transaction per month). Synthesis
  - The number of total devices enabled (cumulative across all months of pilot activity) Synthesis
  - The total number of applications deployed (i.e. How many potential apps with the ability to use the Tap to More use case functionality). Synthesis
  - Total Transaction Volume (in USD) each month. Nedbank
  - Total Transaction Count each month. Nedbank
  - Number of Declined Transactions each month. Nedbank
  - Devices Active per country/territory (if applicable) Synthesis
  - If the Acquirer is in compliance with the Transaction Identifiers disclosed above, with written confirmation from Mastercard, the Acquirer is no long required to send Manual Reporting in this Section 4.
- VISA data requirements:
  - Cart abandonment rate (benchmark)
  - Cart abandonment rate (if using TTOD option)
  - Number of troubleshooting calls per question type
  - Number of buyer complaints per question type
  - Number of declines caused by exceeding the Contactless Payment Devices limit (a maximum of three (3) Contactless Payment Devices are allowed to be tapped to a same consumer’s mobile device using the Solution within a thirty (30) calendar day period). Synthesis and please clear with Visa
  - Visa reserves the right to modify and/or request further information, as needed.

#### Q: What PIN should I use for testing?
A: You can use PIN 12345 which should work for testing purposes.
#### Q: Is PIN capture supported on all Android 11+ devices which have NFC hardware or only a subset of these devices?
A: If the device is 11+, GMS, yes

#### Q: Is the PIN capture screen the only screen controlled by the SDK, and if so can we style it at all?
A: Yes and you can style, currently, the logo at the top, font for the buttons, the cancel and "enter" button. What would you be looking to style?
#### Q: Can a single issuer claim support multiple currencies?
A: Currently, the process for setting up terminal configuration with currency and country codes for specific issuer claims is manual. Contact support for multi-currency setup assistance.
#### Q: Why do smaller GBP amounts work but larger amounts (e.g., £1000) decline after a long wait?
A: This may be due to switch processing limits or timeouts. The system may return "Unable to process transaction" for amounts above certain thresholds, though some transactions may still go through eventually.
Attestation Issues
#### Q: Do you provide a NEXO interface?
A: We don't have our own standalone "NEXO Interface," but we support several integration methods:
Postbridge interface (ISO8583): Direct connection via secure tunnel (e.g., IPsec) into Postilion systems
Custom API integration: We can provide templates for processors to create endpoints
Direct processor integration: Based on processor-specific APIs or specifications
NEXO-based integration: Available through CCS via the Toro gateway
SDK Usage & Lifecycle
#### Q: Can I perform transactions in currencies other than ZAR?
A: Yes, the system supports multiple currencies. The terminal currency code should match the transaction currency code you pass in. Currency and country codes are configured per issuer claim in the JWT as part of the terminal configuration.
For example for British Pound, pass "GBP" as the transaction currency code. For GBP transactions, the CVM (Cardholder Verification Method) limits are set to £500. If the switch rejects the transaction, you can be switched to the auto-approve processor.
