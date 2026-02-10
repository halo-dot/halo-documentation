---
id: sdk
title: Halo Dot Tap to Pay on iPhone SDK Setup Guide
tags:
  - sdk
  - guides
  - tap to pay on iphone
  - iphone
---
# HaloSDK

A Swift SDK for accepting contactless payments on iPhone using Apple's Tap to Pay technology.

## Requirements

You'll need a few things before getting started:

- **iOS 15.5 or later** on a physical device (simulator won't work for Tap to Pay)
- **iPhone XS or newer** — older models don't have the required NFC hardware
- The **ProximityReader entitlement** from Apple (you'll need to apply through your Apple Developer account)
- A merchant account set up through Apple's Tap to Pay program

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

Call this once when your app starts, typically in your AppDelegate or early in your payment flow:

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

When you're ready to accept a payment:

```swift
let result = await HaloSDK.startContactlessPayment(
    amountMinor: 1500,           // $15.00 in cents
    currency: "USD",
    merchantReference: "order_12345"
)
```

This brings up Apple's card reader UI. The customer taps their card or phone, and you get a result back.

### 3. Handle the Result

The SDK returns one of two results — either the payment went through or it didn't:

```swift
switch result {
case .approved(let receipt):
    // Payment went through
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

When a payment is declined, `errorCode` tells you what happened:

| Error Code | Meaning |
|-----------|---------|
| `USER_CANCELLED` | Customer cancelled the payment |
| `CARD_DECLINED` | Card was declined by the issuer |
| `NETWORK_ERROR` | Network connectivity issue |
| `PAYMENT_IN_PROGRESS` | Another payment is already running |
| `DEVICE_NOT_SUPPORTED` | Device can't do Tap to Pay |
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

## Configuration

### Environments

The SDK supports two environments:

```swift
// For development and testing
try HaloSDK.initialize(authToken: token, environment: .sandbox)

// For real payments
try HaloSDK.initialize(authToken: token, environment: .production)
```

Sandbox mode connects to test servers and won't process real payments. Always use this during development.

## Error Handling

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
    // Safe to retry immediately
}

if error.requiresUserAction {
    // Show the user what they need to do
}

if error.isFatal {
    // Can't recover — device doesn't support Tap to Pay
}
```

### Event Delegate

The SDK notifies your app about errors and reader preparation progress through a delegate. Apple requires apps to display a progress indicator while Tap to Pay is being configured, and the delegate makes this easy.

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

The preparation progress callbacks fire during SDK initialization (in the background) and again if the reader needs to be re-prepared before a payment. You don't need to implement all methods — they all have default empty implementations, so just override the ones you care about.

## Security

The SDK handles security automatically. During payment, it continuously monitors for:

- **Screen recording or mirroring** — payment is aborted if detected
- **Jailbreak detection** — compromised devices are blocked
- **App backgrounding** — payment can't proceed if the app isn't in the foreground

You don't need to implement any of this yourself. If a security check fails, you'll get an appropriate error in the payment result.

Sensitive data like tokens are stored in the iOS Keychain, not in UserDefaults or plain files.

## Device Support

Tap to Pay requires specific hardware. The SDK checks this during initialization and will throw `deviceNotSupported` if the device can't accept payments.

**Supported devices:**
- iPhone XS and later (includes XR, 11, 12, 13, 14, 15, 16 series)
- Must be running iOS 15.5 or later
- Must be a physical device — the simulator doesn't have NFC hardware

**Not supported:**
- iPhone X and earlier
- Any iPad (no NFC for payments)
- Simulator builds

## Cancelling a Payment

If you need to cancel a payment that's in progress (maybe a timeout in your UI):

```swift
HaloSDK.cancelPayment()
```

This will stop the card reader. The `startContactlessPayment` call will return `.declined(errorCode: "USER_CANCELLED", errorMessage: "Payment cancelled by user")`.

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

If location permission isn't granted (or the key is missing), transactions will still work — the SDK just won't include location data in the request headers. You don't need to request permission yourself; the SDK handles it automatically when a payment starts.

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

**"Account not linked" error**

The merchant account needs to be set up. Go to Settings → Wallet & Apple Pay on the device and complete the merchant enrollment.

**Location not being sent with transactions**

Check that you've added `NSLocationWhenInUseUsageDescription` to your Info.plist. If the user previously denied location permission, they'll need to enable it manually in Settings → Your App → Location. The SDK won't prompt again after a denial.

**"PPS-4003" or "Request Expired" error**

The encrypted card data must be submitted to the backend within 60 seconds of the card tap. If you're seeing this error, there may be network delays or the payment flow is taking too long. The SDK handles this automatically, but slow network conditions can cause timeouts.

---

## License

