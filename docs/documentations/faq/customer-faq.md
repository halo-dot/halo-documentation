---
id: customer-faq
title: Customer FAQ
---

# Frequently asked questions

## Customer Question  (FAQ)

#### Q: How do we get a transaction working with the SDK?

1. <a href="https://halo.merchantportal.dev.haloplus.io/" target="_blank">Register a developer</a> account with Halo, this will give you AWS credentials to access the maven repository
2. [Then access the SDK](/docs/documentations/sdk/getting-started-with-sdk)
3. [Programmatically initialize the SDK](/docs/documentations/sdk/sdk-integration-guide#6-initiallization-of-the-sdk)
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
A: Available on the <a href="https://halo.merchantportal.dev.haloplus.io/" target="_blank">merchant portal</a> it uses deep links to generate a QrCode that can be scanned to open the Halo app for payment.

#### Q: What is Tap on own?
A: Available on the <a href="https://halo.merchantportal.dev.haloplus.io/" target="_blank">merchant portal</a> allows you to integrate a checkout system in your eCommerce store.

#### Q: What is Push to Pay?
A: Available on the <a href="https://halo.merchantportal.dev.haloplus.io/" target="_blank">merchant portal</a> allows you to link your device to the Halo app for payment.

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
