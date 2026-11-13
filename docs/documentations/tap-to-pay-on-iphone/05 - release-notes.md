---
id: tap-to-pay-release-notes
title: Release Notes
description: Changes in each Halo.Swift (iOS SDK) version for Tap to Pay on iPhone.
tags:
  - sdk
  - guides
  - tap to pay on iphone
  - iphone
---

# Halo.Swift Release Notes

Changes in each Halo.Swift version that affect integrators, newest first.

## 2.0.0

- **Breaking: `.declined` has a third value, `customValues`.** A `switch` that binds two values (`case .declined(let errorCode, let errorMessage)`) no longer compiles. Add `_` or `let customValues` as the third binding, and change your package requirement to `from: "2.0.0"`.
- **Payment provider errors.** When the payment provider rejects a transaction, `errorCode` is `209` and `customValues` can contain the provider's own `errorCode` and `errorMessage`. Keys depend on the provider, so treat them as optional. See [Custom Values](/docs/documentations/tap-to-pay-on-iphone/sdk#custom-values).
- Declines raised by the SDK itself (cancellation, timeouts, device and location checks) have empty `customValues`.

## 1.0.97

- **`isoResponseCode` on `transactionResponseReceived`.** The analytics event metadata now includes the ISO response code from the authorisation response, next to `haloReference`, for approved and declined payments. A numeric code is reported as a string (`15` becomes `"15"`). The key is left out when the backend sends no code.
- **Single Tap + PIN resubmit** emits the same `isoResponseCode`, and now also includes `haloReference`.
- Keep using the payment result `errorCode` for application logic. `isoResponseCode` is the scheme code, for logging and support.

## 1.0.96

- **Location is mandatory and checked before payment starts.** Denied, switched-off, or unavailable location declines with `locationError` before the Tap to Pay UI. `errorMessage` names the exact Settings path (and your app name where relevant).
- **Security violations report their real cause.** Only screen recording returns `screenCaptureDetected` (and resets the SDK). If the app goes to the background during a payment, you get `requestInterrupted` with no SDK reset. Brief inactive states (permission prompts, Control Center, call banners) no longer fail a payment as screen capture.
- **Offline decline message** now says "Transaction declined due to security violation" (match on error codes, not message text).
- Add `NSLocationWhenInUseUsageDescription` to Info.plist and prefer requesting location during onboarding.
