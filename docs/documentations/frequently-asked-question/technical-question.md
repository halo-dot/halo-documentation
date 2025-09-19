---
id: technical-question
title: Technical Question
---

Provides quick solutions to common issues from initial setup to daily operations, all in one place.

-----

## Technical Questions & Troubleshooting ⚙️

This section provides answers to common technical questions and guides you through troubleshooting specific issues with the SDK and your integration.

### Configuration & Setup

#### Question: Can I set the terminal country code, currency, and CVM limits per transaction?

**Answer:** You can set the **currency** for each transaction. For example: `HaloSdk.startTransaction(1.00, 'Some merchant reference', 'ZAR');`.

However, the **country code** and **CVM (Cardholder Verification Method) limits** are configured at the application level on the backend. While these can be updated, the changes will not take effect until the application is restarted.

#### Question: Is dynamic configuration without an app restart a requirement?

**Answer:** No, dynamic configuration without a restart is not a requirement for our system.

#### Question: How do I create a JSON Web Token (JWT)?

**Answer:** To create a JWT, you first need to generate your own **public and private key pair**. You can then follow the instructions in the <a href="https://www.google.com/search?q=/docs/documentations/sdk/jwt" target="_blank">JWT guide</a> to generate the token.

Once you have your key pair, you must submit the **public key** to the <a href="https://halo.developerportal.dev.haloplus.io" target="_blank">developer portal</a>. This key will be used by our system to validate the JWTs you generate.

### Transaction & Data

#### Question: Can I obtain transactions based on a date or time range, not just by transaction ID?

**Answer:** Yes, this functionality is available and accessible via the **<a href="https://halo.developerportal.dev.haloplus.io" target="_blank">developer portal</a>**.

#### Question: Why are my transactions failing with `DeclinedOffline`?

**Answer:** A `DeclinedOffline` error occurs when a transaction is declined by the SDK **before** it can be sent to the backend. This can happen for several reasons:

  * **Card Validation Failure:** The SDK performs a check to verify if the card is a valid Mastercard or Visa and if it supports tap-to-pay. If this check fails, the transaction is declined immediately.
  * **Bad Card:** The physical card itself may be damaged or invalid.
  * **Bad Configuration:** There might be an issue with your setup or an expired configuration.
  * **Early Failure:** The transaction failed at the moment the card finished reading, preventing it from reaching the backend.

#### Question: My transactions are failing with other decline errors. What should I check?

**Answer:** If you are getting decline errors, it could be due to backend **PIN key rotation issues**. To help us investigate, please provide the **transaction reference ID**. The support team can then check if this is the cause and disable PIN key rotation for your environment if necessary.

### Integration & SDK Lifecycle

#### Question: I get "System is not in state to start a new transaction" after a successful transaction. What's wrong?

**Answer:** This error typically occurs when you call `HaloSDK.startTransaction()` again **too quickly** after a previous transaction has been approved. Ensure you have properly implemented the SDK's lifecycle methods as described in the integration guide to avoid race conditions.

#### Question: How should I handle the SDK lifecycle when moving between Android activities?

**Answer:** To manage the SDK lifecycle correctly, follow these best practices:

  * **Do NOT** call `HaloSDK.onDestroy()`. You should remove this call if it's in your code.
  * When returning to an activity where the SDK was previously initialized, you **do not** need to call `HaloSDK.initialize()` again.
  * Always ensure `HaloSDK.onCreate()` is called when returning to the transaction activity.
  * You can perform multiple successive transactions from the same activity instance **without re-initialization**.

#### Question: Why does the SDK fail with camera exceptions when switching between activities?

**Answer:** This is usually a sign of **improper lifecycle management**. Make sure you are not calling `HaloSDK.onDestroy()`. Follow the integration guide's instructions on proper lifecycle implementation to avoid these exceptions.

### App Updates

#### Question: How do app updates occur?

**Answer:** Updates are released as needed, typically for **new features, deprecations** (like moving from dynamic links to app links), or **security enhancements**. We aim for a monthly update cycle.

Updates are first tested with customers in a test environment (e.g., using App Tester) before being promoted to the public. Once an update is published on the Play Store, merchants can be **prompted to update** depending on their device settings or can **manually update** the app via the Play Store.

#### Question: Are updates ever forced? What happens if a user doesn't update?

**Answer:** There are two types of updates:

  * **Optional Updates:** Users can continue using the app without updating. A prompt may appear, but it will not block access.
  * **Forced Updates:** These are for critical changes. Users will be shown a **mandatory update screen** and will be unable to use the app until they install the latest version.

### For Developers

#### Question: What data format do you use for processor integrations? Do you have samples?

**Answer:** We have developed a proprietary **ISO 8583 processor (Postbridge)** that we use to route transaction traffic. We can either provide you with our specification for you to implement, or we can integrate directly with your custom payment processor's specification.

#### Question: What PSPs (Payment Service Providers) are you working with, and in which regions? Do they offer additional reporting?

**Answer:** We are integrated with various PSPs, such as **MPGS (Mastercard Payment Gateway Services)**. PSPs typically offer more features for reconciliation and mark-off files than our platform provides. If you need more specific details, please clarify which acquirers you are interested in.

#### Question: How can I get help debugging specific transaction issues?

**Answer:** To help us debug a transaction issue efficiently, please provide the following details:

  * The **transaction reference ID**.
  * A **detailed description** of the problem, including any specific error messages or logs.
  * **Steps to reproduce** the issue.
  * Information about your **integration setup**.