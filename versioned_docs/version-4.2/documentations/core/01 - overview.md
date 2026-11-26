---
description: >-
  How Halo.SDK fits into your app and backend, and what you'll need to get started.
---

# Halo.SDK

Halo.SDK is Halo Dot's SoftPOS engine, built to run inside your own Android
app. It turns the phone in your merchant's hand into a contactless payment
terminal: it reads the card, captures the PIN when one is needed, and hands
your backend signed, encrypted transaction data ready for authorisation. No
extra hardware needed.

## How it fits together

1. **Your app starts a transaction** with the amount, the currency and the
   EMV tags you need back.
2. **Halo.SDK takes the payment.** It reads the card over NFC and, when
   the transaction calls for it, captures the cardholder's PIN.
3. **Halo.SDK returns a result.** The result carries signed transaction data:
   the tags you asked for in the clear, card data encrypted under your own BDK,
   and the PIN block when present.
4. **Your backend verifies and decrypts it**, then submits it for authorisation.

:::note
Cardholder data never reaches your app in the clear. Sensitive tags, such as the
PAN and track data, only come back encrypted for your backend to decrypt.
:::

## Platforms

Halo.SDK runs on Android 10 (API 29) or later, on devices with NFC. Today
you integrate it through the .NET MAUI package, `HaloDot.Core.Maui`.

## What you'll need

| Item | Details |
| --- | --- |
| **Device** | Android 10 (API 29) or later, with NFC |
| **Halo Dot credentials** | An access key and secret from Halo Dot, used to download Halo.SDK when you build |
| **Token** | A Halo Dot [JWT](/docs/4.2/documentations/core/jwt), issued through your backend |
| **Terminal configuration** | CA public keys and kernel configuration |
| **Your keys** | Two BDK for your devices, to decrypt card data and PIN blocks on your backend |

## Next steps

- **App side:** [Halo.SDK for .NET MAUI](/docs/4.2/documentations/core/maui)
- **Backend side:** [Verifying and decrypting transaction data](/docs/4.2/documentations/core/backend/transaction-data)
