---
description: >-
  The MPoC SDK enables your your application to accept payments, with that we
  have ensured that the SDK itself is a secure solution from end to end.
---

# Security Guidance

This document provides Guidance for users of the API about how to securely use the API and protect the UI display data on the external application. This guidance document provides guidelines on how applications can be protected and how the user interface plays part in protection of sensitive data.&#x20;

Although we have taken every step we can to ensure that the product itself is secure, here are some simple tips you should follow to ensure that the solution is secure from end to end. Here are some things to take into account;&#x20;

1. Never store clear text authentication data (JWTS, usernames, passwords, session token etc.) on the device. always encrypt it before storing
2. Never store full card numbers anywhere - masked card numbers are ok (first 6 and last 4 digits visible)
3. Try to encrypt login credentials before submitting to your backend; don't rely heavily on TLS
4. We recommend the use of a code obfuscation tool&#x20;
5. Ensure that the UI message  are displayed and sent through by the SDK and they let the user know what is happening. (app prompts, progress reports, transaction results etc.)&#x20;
6. Enforce Session Stoppage (ending the session of a user after a certain period of inactivity)
7. Never store a full pan anywhere but only store mask pans.
8. Users must also be cognizant of protecting their own personal information&#x20;
    1. Not show anyone their PIN entry
    2. Protect their own card/cellphone details&#x20;
9. Ensure that the Integrating Application signs the application with appropriate digital certificate. (Leverage Google Play App Signing) for added security&#x20;
10. Follow Android's best practices for handling app permissions, including runtime permissions before executive sensitive operations.&#x20;
    1. Ensure that the permissions are managed carefully and request permissions to access sensitive resources.&#x20;
