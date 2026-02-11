---
id: sdk
title: Halo Dot Tap to Pay on iPhone SDK Setup Guide
tags:
  - sdk
  - guides
  - tap to pay on iphone
  - iphone
---
# Halo.Swift (iOS SDK)

Halo.Swift enables merchants to accept contactless card payments on iPhone using Apple’s Tap to Pay on iPhone technology. The SDK handles device capability checks, the Proximity Reader lifecycle, communication with Apple services, transaction execution, and security enforcement.

Halo.Swift is distributed as the `HaloSDK` Swift module. All code examples reference the `HaloSDK` namespace.

## Requirements

You'll need the following before getting started:

- iOS 15.5 or later on a physical device (the simulator will not work for Tap to Pay)

- iPhone XS or newer. Older models do not have the required NFC hardware

- The ProximityReader entitlement from Apple, requested through your Apple Developer account

- A merchant account enrolled in Apple’s Tap to Pay on iPhone program

## Before You Start

Before integrating the SDK into your app, you'll need to set up JWT authentication on your backend. This involves generating RSA keys and configuring token signing — the SDK uses these tokens for all API requests.

Follow the [JWT Integration Guide](./jwt) to get that sorted first. Once your backend can generate valid JWT tokens, come back here and continue with installation.

## Installation

Login to AWS CodeArtifact using the following commands:
```bash
export AWS_ACCESS_KEY_ID=<provided to you by Halo Dot>
export AWS_SECRET_ACCESS_KEY=<provided to you by Halo Dot>
aws codeartifact login --tool swift --repository halo_sdk_ios --domain halo --domain-owner 459295082152 --region eu-west-1
```

Add it directly to your `Package.swift`:

```swift
dependencies: [
    .package(id: "synthesis.halosdk", from: "1.0.40")
]
```

Then import it where you need it:

```swift
import HaloSDK
```

## Quick Start

### 1. Initialize the SDK

Your app must call `initialize` to trigger the initial preparation and warming up of Tap to Pay on iPhone at app launch or when the app enters the foreground.

```swift
do {
    let capabilities = try HaloSDK.initialize(
        authToken: "your_auth_token_from_backend",
        environment: .sandbox  // use .production for live payments
    )

    if capabilities.canAcceptPayments {
        print("Ready to accept payments")
    }

} catch HaloError.deviceNotSupported(let reason) {
    // This device can't accept Tap to Pay
    print("Device not supported: \(reason)")

} catch {
    print("Initialization failed: \(error)")
}

```

The SDK will check if the device supports Tap to Pay and throw an error if it doesn't. You'll get back a `HaloDeviceCapabilities` object that tells you what the device can do.

### 2. Start a Payment

Starting a contactless payment must be initiated by a clear user action, such as tapping a button, in accordance with Apple’s Tap to Pay on iPhone user experience requirements.

```swift
let result = await HaloSDK.startContactlessPayment(
    amountMinor: 1500,           // $15.00 in cents
    currency: "USD",
    merchantReference: "order_12345"
)
```

This brings up Apple's card reader UI. The customer taps their card on the iPhone, and a result is returned. `merchantReference` is an application-defined identifier used to correlate the payment with an internal order or transaction. It is returned unchanged in the payment receipt and can be used for reconciliation or support purposes.

### 3. Handle the Result

startContactlessPayment returns a HaloPaymentResult that represents the final outcome of a single checkout attempt. A payment is either approved or declined.

A declined result may represent a customer cancellation, an issuer decline, a network failure, or another error condition.

```swift
switch result {
case .approved(let receipt):
    // Payment completed successfully
    print("Payment approved: \(receipt.transactionId)")
    print("Amount: \(receipt.amountMinor) \(receipt.currency)")
    print("Card: \(receipt.cardBrand ?? "Unknown") ending in \(receipt.last4 ?? "****")")
    
case .declined(let errorCode, let errorMessage):
    // Payment didn't go through — could be a decline, cancellation, or error
    print("Payment declined")
    if let code = errorCode {
        print("Error code: \(code)")
    }
    if let message = errorMessage {
        print("Reason: \(message)")
    }
}
```

### Common Error Codes

When a payment is declined, `errorCode` identifies the outcome for application logic and analytics. User-facing messaging should remain clear and non-technical.

| Error Code | Meaning |
|-----------|---------|
| `USER_CANCELLED` | Customer cancelled the payment |
| `CARD_DECLINED` | Card was declined by the issuer |
| `NETWORK_ERROR` | Network connectivity issue |
| `PAYMENT_IN_PROGRESS` | Another payment is already in progress |
| `DEVICE_NOT_SUPPORTED` | Device does not support Tap to Pay on iPhone |
| `SCREEN_CAPTURE_DETECTED` | Screen recording/mirroring detected |
| `NOT_INITIALIZED` | SDK wasn't initialized |
| `TIMEOUT` | Request timed out |
| `104` | Server configuration error (contact support) |

You can also check these programmatically:

```swift
case .declined(let errorCode, let errorMessage):
    switch errorCode {
    case HaloErrorCode.userCancelled:
        // User tapped cancel — maybe show "Try again?" prompt
        break
    case HaloErrorCode.cardDeclined:
        // Card didn't work — ask for different payment method
        break
    case HaloErrorCode.networkError:
        // Network issue — worth retrying
        break
    default:
        // Show the error message to the user
        showAlert(title: "Payment Failed", message: errorMessage ?? "Please try again")
    }
}

```

Applications should always present a clear outcome after a contactless payment attempt. This includes confirming successful payments, indicating when a payment is declined, and clearly distinguishing user-initiated cancellations from errors. This behavior is required to meet Apple’s Tap to Pay on iPhone checkout experience guidelines.

## Configuration

Configuration is applied during SDK initialization and affects how the SDK prepares Tap to Pay on iPhone, connects to backend services, and validates transactions. Configuration changes require reinitializing the SDK to take effect.

### Environments

The SDK supports two environments:

```swift

// For development and testing

try HaloSDK.initialize(authToken: token, environment: .sandbox)

// For real payments

try HaloSDK.initialize(authToken: token, environment: .production)

```

Sandbox mode connects to test services and does not process real payments. It should be used for development and testing only. Production mode is required for live payments and App Store distribution.

### Mock Mode

If you want to test the payment flow without a physical card reader setup, you can enable mock mode by using an auth token that starts with `mock_` or `test_`:

```swift

try HaloSDK.initialize(
    authToken: "mock_test_token",
    environment: .sandbox
)

```

Mock mode simulates the payment result flow and can be used for UI and integration testing without submitting a real Tap to Pay transaction. It is intended for development and automated testing. Mock mode does not replace Apple entitlements or device requirements for real contactless payments.

Use sandbox mode when testing real Tap to Pay on iPhone behavior on a physical device. Use mock mode when validating application logic, UI flows, or automated tests where real card interaction is not required.

## Error Handling

These error codes apply to declined payment results returned from startContactlessPayment. They represent transaction-level outcomes rather than SDK initialization or configuration errors.

Payment attempts return a HaloPaymentResult. Transaction-level outcomes (including declines and cancellations) are returned as .declined with an error code. HaloError is used for SDK lifecycle and operational errors (for example initialization, preparation, token issues, or reader failures).

The SDK uses a single `HaloError` enum for all errors. Here's how to handle the common ones:

```swift

switch error {
case .notInitialized:
    // You forgot to call HaloSDK.initialize()
    
case .deviceNotSupported(let reason):
    // Device can't do Tap to Pay
    // reason tells you why: .modelNotSupported, .osVersionNotSupported, etc.
    
case .deviceNotCompliant:
    // Device failed security checks (possibly jailbroken)
    
case .paymentInProgress:
    // There's already a payment happening — wait for it to finish
    
case .networkError(let reason):
    // Network issues — check connectivity and retry
    
case .accountLinkingError(let reason):
    // Merchant account needs to be linked in Settings → Wallet & Apple Pay
    
case .tokenError(let reason, let detail):
    // Connection token issue — might need a fresh token from your backend
    
case .readerError(let reason, let detail):
    // Card reader had a problem — usually retryable
    
case .userCancelled:
    // Customer cancelled the payment
    
case .cardDeclined:
    // The card was declined by the issuer

default:
    print("Error: \(error.localizedDescription)")
}
```

### Error Properties

Every `HaloError` has properties that help you decide what to do:

```swift

if error.isRetryable {
    // Retry the operation (for example refresh token, re-attempt preparation, or retry payment start)
}

if error.requiresUserAction {
    // Prompt the user to complete the required step (for example account linking or enabling permissions)
}

if error.isFatal {
    // Disable Tap to Pay features
}
```

### Event Delegate

The SDK notifies your app about errors and reader preparation progress through a delegate. Applications should display clear preparation status while Tap to Pay on iPhone is being configured. The delegate provides preparation progress and readiness callbacks to support this.

The example below shows one way to map SDK events to UI state. Replace the UI updates with your application’s own patterns.

```swift
class PaymentHandler: HaloEventDelegate {
    // Called during reader preparation (0.0 to 1.0)
    func haloSDK(didUpdatePreparationProgress progress: Double) {
        DispatchQueue.main.async {
            self.progressView.progress = Float(progress)
            self.statusLabel.text = "Preparing Tap to Pay..."
        }

    }
    
    // Called when reader is ready to accept payments
    func haloSDKDidBecomeReady() {
        DispatchQueue.main.async {
            self.progressView.isHidden = true
            self.payButton.isEnabled = true
            self.statusLabel.text = "Ready to accept payments"
        }
    }

    // Called if reader preparation fails
    func haloSDK(didFailPreparationWithError error: HaloError) {
        DispatchQueue.main.async {
            self.progressView.isHidden = true
            self.statusLabel.text = "Setup failed: \(error.localizedDescription)"
        }
    }

    // Called when any error occurs
    func haloSDK(didReceiveError event: HaloErrorEvent) {
        Analytics.track("payment_error", properties: [
            "error_code": event.errorCode,
            "error_name": event.errorName,
            "description": event.errorDescription,
            "source": event.source.rawValue
        ])
    }
}

// Set it up early, before or right after initialization
HaloSDK.setEventDelegate(PaymentHandler())
```

Preparation progress callbacks are triggered during SDK initialization and whenever the system needs to prepare or re-prepare Tap to Pay on iPhone (for example after app foregrounding or a configuration change). Applications should be prepared to receive these callbacks more than once during the app lifecycle.

## Security

The SDK enforces security controls during Tap to Pay on iPhone preparation and payment. If a prohibited condition is detected, the payment attempt is stopped and an appropriate error is returned.

- **Screen recording or mirroring** — the payment attempt is aborted if detected

- **Compromised device checks** — devices that fail security integrity checks are blocked

- **App state changes** — the payment cannot proceed if the app moves out of the foreground

You don't need to implement any of this yourself. If a security check fails during a payment attempt, the payment returns a declined result with an appropriate error code. If a device fails mandatory security checks outside of a payment attempt, the SDK surfaces a HaloError and disables Tap to Pay functionality for that device.

Sensitive data like tokens are stored in the iOS Keychain, not in UserDefaults or plain files.

## Device Support

Tap to Pay requires specific hardware. The SDK checks this during initialization and will throw `deviceNotSupported` if the device can't accept payments.

**Supported devices:**

- iPhone XS and later (includes XR, 11, 12, 13, 14, 15, 16 series)

- Must be running iOS 15.5 or later

- Must be a physical device — the simulator doesn't have NFC hardware

**Not supported:**

- iPhone X and earlier

- Any iPad (Tap to Pay on iPhone is not supported on iPadOS)

- Simulator builds

Device compatibility is evaluated during SDK initialization based on device model, iOS version, entitlements, and required system capabilities. If any requirement is not met, initialization fails with deviceNotSupported.

## Cancelling a Payment

If you need to cancel a payment that's in progress (maybe a timeout in your UI):

```swift
HaloSDK.cancelPayment()
```

This stops the card reader and ends the current payment attempt. The `startContactlessPayment` call will return `.declined(errorCode: "USER_CANCELLED", errorMessage: "Payment cancelled by user")`.

Applications should call cancelPayment() only in response to a clear user action or application-level timeout. The SDK automatically cancels the payment if required by system, security, or lifecycle conditions, and applications do not need to handle those cases explicitly.

## Cleanup

When you're done with the SDK (user logs out, switching accounts, etc.):

```swift
HaloSDK.deinitialize()
```

This clears all cached tokens and resets the SDK state. You'll need to call `initialize()` again before accepting more payments.

## Location Permissions

The SDK can include device location in transaction requests for fraud prevention. This is optional but recommended. To enable it, add this key to your app's `Info.plist`:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Location is used to help verify transactions and prevent fraud.</string>

```

If location permission is denied or unavailable, transactions still proceed normally, but location data is not included in the request headers. If a user has previously denied location permission, iOS will not prompt again and the user must enable it manually in system settings.

**What happens with location:**
- If granted: Location coordinates are sent in the `X-Location` header for fraud scoring
- If denied: Transaction proceeds normally without location data
- If not determined: SDK requests permission automatically (with a 5-second timeout)

## Transaction Flow

When you call `startContactlessPayment()`, here's what happens under the hood:

1. **Card read** — Apple's ProximityReader captures encrypted card data
2. **Backend submission** — SDK sends the encrypted data to your payment processor via `POST /transactions/apple`
3. **Result mapping** — Backend response is mapped to `HaloPaymentResult`

The SDK automatically includes these headers with each transaction:
- `X-Device-Installation-Id` — A unique UUID generated once per device install (persisted in Keychain)
- `X-Correlation-Id` — A unique UUID for each transaction (useful for debugging)
- `X-Location` — Device coordinates if location permission is granted
- `Authorization` — Bearer token from your auth configuration

### Receipt Data

When a payment is approved, the `HaloReceipt` contains data from both the card reader and the backend:

```swift

case .approved(let receipt):
    receipt.transactionId    // Backend's haloReference
    receipt.authCode         // Authorization code from processor
    receipt.cardBrand        // Card type (Visa, Mastercard, etc.)
    receipt.last4            // Last 4 digits of card
    receipt.amountMinor      // Amount in minor units
    receipt.currency         // Currency code
    receipt.reference        // Your merchant reference
    receipt.approvedAt       // Timestamp
```

## Thread Safety

All HaloSDK methods are `@MainActor` — you should call them from the main thread. The async methods (`startContactlessPayment`) can be awaited from any async context and will handle threading internally.

```swift
// This is fine
Task { @MainActor in
    let result = await HaloSDK.startContactlessPayment(...)
}

// This is also fine if you're already in a @MainActor context
@MainActor
func processPayment() async {
    let result = await HaloSDK.startContactlessPayment(...)
}
```

## Troubleshooting

**"Device not supported" even though I have an iPhone XS**

Make sure you're running on a physical device, not the simulator. Also check that you're on iOS 15.5 or later.

**"Entitlement missing" error**

You need the ProximityReader entitlement from Apple. This requires approval through the Apple Developer program for Tap to Pay.

**Payments work in mock mode but fail with real tokens**

Your backend needs to provide valid Apple-signed JWT tokens. Mock tokens (starting with `mock_` or `test_`) bypass the real Apple infrastructure.

**Location not being sent with transactions**

Check that you've added `NSLocationWhenInUseUsageDescription` to your Info.plist. If the user previously denied location permission, they'll need to enable it manually in Settings → Your App → Location. The SDK won't prompt again after a denial.

**"PPS-4003" or "Request Expired" error**

The encrypted card data must be submitted to the backend within 60 seconds of the card tap. If you're seeing this error, there may be network delays or the payment flow is taking too long. The SDK handles this automatically, but slow network conditions can cause timeouts.
