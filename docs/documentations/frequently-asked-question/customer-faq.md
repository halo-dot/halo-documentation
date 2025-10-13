---
id: customer-faq
title: Customer FAQ
---

# Frequently Asked Questions

Provides answers to common questions about using our platform, SDK, and APIs.

## General Questions

### What is the difference between Scan to Tap, Tap on Own, and Push to Pay?

  * **Scan to Tap:** This feature is available on the <a href="https://halo.merchantportal.dev.haloplus.io/" target="_blank">merchant portal</a> and uses deep links to generate a QR code. A customer can scan this QR code to open the Halo app and complete a payment.
  * **Tap on Own:** This feature, also available on the <a href="https://halo.merchantportal.dev.haloplus.io/" target="_blank">merchant portal</a>, allows you to integrate a checkout system directly into your e-commerce store.
  * **Push to Pay:** This feature lets you link your device to the Halo app to facilitate payments. It is available on the <a href="https://halo.merchantportal.dev.haloplus.io/" target="_blank">merchant portal</a>.

### What is the difference between Deep Link and Intent-based integration?

  * **Intent-based Integration:** This is an app-to-app transaction. A third-party app uses an "intent" to connect with the Halo app, which then handles the transaction with a payment provider.
  * **Deep Link Integration:** This involves generating a QR code that, when scanned, opens the Halo app directly to a specific payment flow.

### What are the reporting requirements for Master Card and VISA?

Reporting requirements vary by card network.

  * **Mastercard:** Reports must mention both the Acquirer (Nedbank) and the Solution Developer (Synthesis). Required data includes the number of new and total devices enabled, active merchants, total applications deployed, and monthly transaction volume, count, and declined transactions. Some data is provided by Synthesis, and some by the acquirer.
  * **VISA:** This data is typically for troubleshooting and analysis. It includes cart abandonment rates, troubleshooting call volume, buyer complaints, and the number of declines caused by exceeding contactless device limits.

## Transaction & Refund Questions

### How do I get a transaction working with the SDK?

Follow these steps to set up and process a transaction with the SDK:

1.  **Register a Developer Account:** First, <a href="https://halo.merchantportal.dev.haloplus.io/" target="_blank">register a developer account</a> on the Halo portal to get the necessary AWS credentials for accessing the Maven repository.
2.  **Access the SDK:** <a href="https://www.google.com/search?q=/docs/documentations/sdk/getting-started-with-sdk" target="_blank">Learn how to access the SDK here.</a>
3.  **Initialize the SDK:** <a href="https://www.google.com/search?q=/docs/documentations/sdk/sdk-integration-guide%236-initialization-of-the-sdk" target="_blank">Programmatically initialize the SDK</a> within your application.
4.  **Start a Transaction:** <a href="https://www.google.com/search?q=/docs/documentations/sdk/sdk-integration-guide%237-transaction-flow" target="_blank">Follow the transaction flow guide</a>. You can start a transaction with a simple command, such as:
    `val result = HaloSDK.startTransaction(amount, reference)`
5.  **Understand the SDK Lifecycle:** For a deeper understanding, <a href="https://www.google.com/search?q=/docs/documentations/sdk/sdk-integration-guide%235-life-cycle-methods" target="_blank">review the SDK's life cycle methods</a>.

### What is the difference between a refund, a reversal, and a void?

These terms are often used interchangeably but have distinct meanings in the payment world:

  * **Refund:** A refund is processed *after* a transaction has been settled (money has been moved). The funds are sent back to the cardholder's account. <a href="https://www.google.com/search?q=/docs/documentations/api-docs/refunds%23refund" target="_blank">See documentation for more details.</a>
  * **Reversal:** A reversal occurs *before* a transaction has been settled. No money is moved. This is typically used to cancel a transaction within the same day or session. <a href="https://www.google.com/search?q=/docs/documentations/api-docs/refunds%23reversal" target="_blank">See documentation for more details.</a>
  * **Void:** Similar to a reversal, a void transaction is canceled *before* it is settled. No money is moved. This is also typically used within the same day or session. <a href="https://www.google.com/search?q=/docs/documentations/api-docs/refunds%23void" target="_blank">See documentation for more details.</a>

## Integration Questions

### Is PIN capture supported on all Android 11+ devices with NFC hardware?

Yes, if the device is running Android 11 or higher and has Google Mobile Services (GMS), PIN capture is supported.

### What PIN should I use for testing?

For testing purposes, you can use the PIN **12345**.

### Can I perform transactions in currencies other than ZAR?

Yes, the system supports multiple currencies. The currency and country codes are configured per issuer claim within the terminal configuration. When passing a transaction, the terminal currency code must match the transaction currency code.

  * **Example:** For a transaction in British Pounds, pass `"GBP"` as the transaction currency code.
  * **Note:** For GBP transactions, the CVM (Cardholder Verification Method) limits are set to £500.

### Why do some large GBP transactions (e.g., £1000) fail?

Larger amounts may be declined due to switch processing limits or timeouts. If a transaction amount exceeds certain thresholds, the system may return an "Unable to process transaction" error, even if some large transactions occasionally go through.

### Can a single issuer claim support multiple currencies?

Currently, the process for setting up terminal configurations with multiple currency and country codes is manual. Please contact support for assistance with multi-currency setup.

### Is the PIN capture screen the only one controlled by the SDK? Can I style it?

Yes, the PIN capture screen is the only one controlled by the SDK. You have limited styling options, including the ability to customize the top logo and the font for the buttons (including "cancel" and "enter"). If you require further customization, please let us know what you'd like to change.

### Do you provide a NEXO interface?

We do not offer a standalone "NEXO Interface," but we support several integration methods:

  * **Postbridge Interface (ISO8583):** Direct connection via a secure tunnel (e.g., IPsec) into Postilion systems.
  * **Custom API Integration:** We can provide templates to help processors create custom endpoints.
  * **Direct Processor Integration:** Integration based on a processor's specific APIs or specifications.
  * **NEXO-based Integration:** Available through CCS via the Toro gateway.