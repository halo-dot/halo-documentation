---
id: technical-question
title: Technical Question
---

#### Q: Can you set the terminal country code / currency / CVM limits per transaction?
A: The currency can be set per transaction
    <br/>e.g. `HaloSdk.startTransaction(1.00, 'Some merchant reference', 'ZAR');`. <br/>
    The country code and CVM limits are configured on the backend at the application level. <br/>
    While this configuration can be updated, doing so requires an application restart.

#### Q: Is dynamic configuration without restart a requirement on your side?
A: No

#### Q: Can you obtain transactions based on some date / time range as opposed to just using a txn ID?
A: This is possible and accessible via the <a href="https://halo.merchantportal.dev.haloplus.io/" target="_blank">developer portal</a>

#### Q: Is PIN capture supported on all Android 11+ devices which have NFC hardware or only a subset of these devices?
A: If the device is 11+, GMS, yes

#### Q: Is the PIN capture screen the only screen controlled by the SDK, and if so can we style it at all?
A: Yes and you can style, currently, the logo at the top, font for the buttons, the cancel and "enter" button. What would you be looking to style?

#### Q: What PSPs are you working with and in what regions?
* **Do they offer additional txn reporting APIs in addition to what halo.dot offers?**<br/>
A: The PSP we are integrated with would offer more features around recons and mark off files etc. MPGS as an example but would need a bit more context on the ask here ? Are you asking which acquirers we have integrations with?

#### Q: What is the data format for outgoing processor integrations (e.g. ISO 8583 etc?) and do you have samples
A: We have developed an ISO 8583 processor (Postbridge) that allows us to establish a connection and route transaction traffic through it. You can either implement to our specification which we will provide, or we can integrate directly with your custom payment processor specification.

#### Q: Why do we get DeclinedOffline?
  - SDK performs check to verify card to be mastercard or visa. If check fails or card does not accept tap to pay. SDK declines the transaction before it goes online
  - Bad Card
  - Bad Config
  - Transaction failed before reaching backend
  - Fails at the point the car finishes reading

#### Q: How do Android app updates occur?
  - Updates to the application are released as needed typically when new features are introduced, existing features are deprecated (such as the transition from dynamic links to app links), or in the rare case of a security enhancement. General maintenance or performance improvements may also prompt an update (We aim for once a month).
  - Before any update is rolled out to production, it is tested in coordination with our customers. For example, in the case of the Nightsbridge application, changes are first validated in the test environment using App Tester. Once approved, the update is promoted to the internal test track, closed testing on the Play Store and then released publicly.
  - Once an update is published to the Play Store, merchants may be prompted to update their app depending on their device settings. Alternatively, merchants can manually update the app via the Play Store.

#### Q: How are update forced, if a user does not perform an update, what happens?
  - There are two types of updates:
    - Optional updates: These allow the user to continue using the app without interruption. A prompt may appear encouraging them to update, but it does not block access.
    - Forced updates: These are typically issued for critical changes. In such cases, users are presented with a mandatory update screen that prevents further use of the app until the latest version is installed.

#### Q: How do create a JWT?
A: You will need to generate your own public key and private key pair. You can use the guid located in the [JWT guide](/docs/documentations/sdk/jwt) to generate a JWT.<br/>
You will need to submit the public key to the <a href="https://go.developerportal.qa.haloplus.io/" target="_blank">developer portal</a> which will be used to validate your JWT.