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

- The ProximityReader entitlement from Apple, requested through your Apple Developer account as `admin user`
- - https://developer.apple.com/contact/request/tap-to-pay-on-iphone/
- - https://developer.apple.com/documentation/ProximityReader/setting-up-the-entitlement-for-tap-to-pay-on-iPhone

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

    .package(id: "synthesis.halosdk", from: "1.0.92")

]
```

Then import the module where needed:

```swift

import HaloSDK
import Combine  // Required for the token provider

```

## Quick Start

### 1. Initialize the SDK

Your app provides a **token provider closure** that the SDK calls whenever it needs an auth token. The SDK calls it once during initialization (to validate it works), and again automatically whenever the cached token expires or is rejected.

```swift

do {

    let capabilities = try await HaloSDK.initialize(

        tokenProvider: {
            Future { promise in
                // Call your backend to get a fresh JWT
                YourBackend.fetchAuthToken { token, error in
                    if let token = token {
                        promise(.success(token))
                    } else {
                        promise(.failure(error ?? HaloError.authTokenUnauthorized))
                    }
                }
            }
        },

        environment: .sandbox  // use .production for live payments
        // enablePerformanceLogging: true  // opt-in, only if your backend supports /apple/performance-testing


    )

    if capabilities.canAcceptPayments {

        print("Ready to accept payments")

    }

} catch HaloError.deviceNotSupported(let reason) {

    // This device can't accept Tap to Pay

    print("Device not supported: \(reason)")

} catch HaloError.authTokenUnauthorized {

    // Token provider failed — check your backend

    print("Token provider returned invalid token")

} catch {

    print("Initialization failed: \(error)")

}

```

The SDK checks device capabilities and throws if the device doesn't support Tap to Pay. You get back a `HaloDeviceCapabilities` object that tells you what the device can do.

**Why a token provider instead of a static token?** Tokens expire. With a provider, the SDK can fetch a fresh token on-demand — before requests if the JWT is expired, or automatically on 401 retry. You don't need to worry about token expiry timing or re-initializing the SDK.

**Production base URL:** In production, the SDK automatically derives the API base URL from the JWT token's `aud` (audience) claim. For example, if the token's `aud` is `kernelserver.{xyz}.prod.haloplus.io`, the SDK uses `https://kernelserver.{xyz}.prod.haloplus.io` as the base URL. This means the production URL is never hardcoded — it comes from your backend's token configuration.

### 2. Start a Payment

Starting a contactless payment must be initiated by a clear user action, such as tapping a button, in accordance with Apple’s Tap to Pay on iPhone user experience requirements.

```swift

let result = await HaloSDK.startContactlessPayment(

    amountMinor: 1500,           // 15.00 in cents

    currency: "ZAR",

    merchantReference: "order_12345"

    // type: .purchase (default) or .refund

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

When a payment is declined, `errorCode` identifies the outcome for application logic and analytics. Error codes match Apple's `PaymentCardReaderError` case names exactly where applicable. User-facing messaging should remain clear and non-technical.

| Error Code | Apple Error | Meaning | What Consumer App Should Do |
|-----------|-------------|---------|----------------------------|
| `userCancelled` | — | Customer cancelled the payment | Show "Payment cancelled" - optionally prompt to try again |
| `cardDeclined` | — | Card was declined by issuer | Ask for different payment method |
| `networkError` | `networkError` | Network connectivity issue | Show: "Tap to Pay on iPhone requires your phone to be connected to the internet. Check your network settings and try again." |
| `networkAuthenticationError` | `networkAuthenticationError` | Network authentication failure | Show: "Tap to Pay on iPhone requires your phone to be connected to the internet. Check your network settings and try again." |
| `serviceConnectionError` | `serviceConnectionError` | Internal service unavailable | Show: "Tap to Pay on iPhone requires your phone to be connected to the internet. Check your network settings and try again." |
| `timeout` | — | Payment session timed out | Allow retry |
| `readNotAllowedDuringCall` | `readNotAllowedDuringCall` | Phone call in progress | Show: "Tap to Pay on iPhone can't be used while a call is in progress." |
| `requestInterrupted` | `requestInterrupted` | App interrupted during read | Show: "Tap to Pay on iPhone was interrupted. If you're on a call, end it and try again." |
| `backgroundRequestNotAllowed` | `backgroundRequestNotAllowed` | App went to background | Bring app to foreground and retry - do not show modal alert if triggered from background init |
| `passcodeDisabled` | `passcodeDisabled` | No passcode set on device | Show: "Tap to Pay on iPhone requires you to set a passcode on your device. To set a passcode, go to Settings > Face ID & Passcode or Settings > Touch ID & Passcode." |
| `osVersionNotSupported` | `osVersionNotSupported` | iOS version too old | Show: "Tap to Pay on iPhone requires the latest version of iOS. To update, go to Settings > General > Software Update." |
| `modelNotSupported` | `modelNotSupported` | Device model not supported | Show generic error alert |
| `unsupported` | `unsupported` | Unsupported hardware or configuration | Show generic error alert |
| `deviceBanned` | `deviceBanned` | Device banned by Apple | Show: "Device banned until [date]. Please contact support." |
| `paymentInProgress` | — | Another payment is already running | Wait for current payment to finish |
| `screenCaptureDetected` | — | Screen recording/mirroring detected | Abort payment - show security warning |
| `notInitialized` | — | SDK wasn't initialized | Call `initialize()` first |
| `authTokenUnauthorized` | — | Auth token rejected (401) | Fetch new token from backend and reinitialize SDK |
| `locationError` | — | Location services unavailable | Guide user to enable location in Settings → Privacy → Location Services |
| `accountNotLinked` | `accountNotLinked` | Merchant account not linked | SDK automatically calls `linkAccount()` — no manual action needed |
| `accountLinkingRequiresiCloudSignIn` | `accountLinkingRequiresiCloudSignIn` | iCloud sign-in required | Show: "Tap to Pay on iPhone requires you to sign in with an Apple Account. To sign in, go to Settings > Sign in to your iPhone." |
| `accountLinkingFailed` | `accountLinkingFailed` | Account linking failed | Show: "An error occurred while linking the Apple Account for Tap to Pay on iPhone. Try again with a different Apple Account." |
| `accountLinkingCheckFailed` | `accountLinkingCheckFailed` | Account status check failed | Show generic error alert |
| `accountLinkingCancelled` | `accountLinkingCancelled` | User cancelled account linking | Provide way to resume linking |
| `accountAlreadyLinked` | `accountAlreadyLinked` | Account already linked | No action needed |
| `accountDeactivated` | `accountDeactivated` | Account deactivated | Show generic error alert |
| `invalidReaderToken` | `invalidReaderToken` | Invalid reader token | Check token generation in backend |
| `emptyReaderToken` | `emptyReaderToken` | Empty reader token | Check token generation in backend |
| `tokenExpired` | `tokenExpired` | Reader token expired | SDK will fetch fresh token automatically |
| `prepareFailed` | `prepareFailed` | Reader preparation failed | Show specific guidance based on errorMessage (2031/2033/pairing) |
| `readerBusy` | `readerBusy` | Card reader is busy | Retry payment |
| `notReady` | `notReady` | Reader session not ready | Retry payment |
| `prepareExpired` | `prepareExpired` | Reader session expired | Retry payment |
| `readerMemoryFull` | `readerMemoryFull` | Reader memory full | Show: "Reader memory is full. Please remove one or more cards from Apple Wallet and try again." |
| `merchantBlocked` | `merchantBlocked` | Merchant blocked (exceeded device limit) | Show generic error alert |
| `invalidMerchant` | `invalidMerchant` | Invalid merchant configuration | Contact support to verify merchant enrollment |
| `notAllowed` | `notAllowed` | Entitlement or configuration issue | Contact support to verify merchant enrollment |
| `storeAndForwardNotAllowed` | `storeAndForwardNotAllowed` | Store and forward not allowed | Check offline payment configuration |
| `storeAndForwardSessionExpired` | `storeAndForwardSessionExpired` | Store and forward session expired | Check offline payment configuration |
| `storeAndForwardSessionInvalidated` | `storeAndForwardSessionInvalidated` | Store and forward session invalidated | Check offline payment configuration |
| `storeAndForwardTokenIssuerChanged` | `storeAndForwardTokenIssuerChanged` | Token issuer changed in offline mode | Check offline payment configuration |
| `invalidAmount` | — | Invalid payment amount | Validate amount before calling SDK |
| `invalidCurrency` | — | Invalid currency code | Use valid ISO 4217 currency codes (e.g., "USD", "ZAR") |
| `invalidReference` | — | Invalid merchant reference | Provide valid reference (max 64 characters) |
| `transactionError` | — | Server transaction error | Show generic error alert |
| `offlineDeclined` | — | Transaction declined offline | Show: "Transaction declined due to security validation" |
| `cardNotSupported` | — | Card not supported for transaction | Ask for different card or payment method |
| `unknown` | `unknown` | Unexpected Apple error | Show generic error alert |
| `systemError` | — | System-level error | Show generic error alert |
| `104` | — | Server configuration error | Contact support |

**Generic error alert** (for `unknown`, `systemError`, `merchantBlocked`, and any unrecognised code):
```
Title:    "Tap to Pay on iPhone Unavailable"
Body:     "An error occurred while starting Tap to Pay on iPhone. Try again later. If the error persists, contact support."
Primary:  "Contact Support"
Secondary: "Close"
```

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

    case HaloErrorCode.authTokenUnauthorized:

        // Auth token rejected — fetch a new token from your backend and reinitialize

        break

    case HaloErrorCode.offlineDeclined:

        // Transaction declined due to security validation

        // Cryptogram Information Data (9F27) = 00 in purchase transactions

        break

    case HaloErrorCode.cardNotSupported:

        // Card not supported for this transaction type

        break

    case HaloErrorCode.locationError:

        // Location services required but unavailable

        // Guide user to enable location in Settings

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
try await HaloSDK.initialize(tokenProvider: myProvider, environment: .sandbox)

// For real payments
try await HaloSDK.initialize(tokenProvider: myProvider, environment: .production)

```

Sandbox mode connects to a static test endpoint (`kernelserver.go.dev.haloplus.io`) and does not process real payments. It should be used for development and testing only.

Production mode derives the API base URL dynamically from the JWT token's `aud` (audience) claim. For example, a token with `"aud": "kernelserver.istore.prod.haloplus.io"` results in the SDK using `https://kernelserver.istore.prod.haloplus.io`. This means the production endpoint is controlled entirely by your backend's token configuration — the SDK does not hardcode it.

### Token Provider

The token provider is a closure that returns a `Future<String, Error>`. The SDK calls it:

1. **During initialization** — to validate your backend is working
2. **Before requests** — if the cached JWT is expired (or within 30 seconds of expiry)
3. **On 401 retry** — if the backend rejects a token the SDK thought was valid

Here's a typical implementation:

```swift

func makeTokenProvider() -> @Sendable () -> Future<String, Error> {
    return {
        Future { promise in
            // Your async backend call
            APIClient.shared.getAuthToken { result in
                switch result {
                case .success(let token):
                    promise(.success(token))
                case .failure(let error):
                    promise(.failure(error))
                }
            }
        }
    }
}

// Use it
try await HaloSDK.initialize(
    tokenProvider: makeTokenProvider(),
    environment: .sandbox
)

```

**Gotchas:**

- The provider must be `@Sendable` — it can be called from any thread
- Return quickly — the SDK waits for your provider before proceeding
- If your provider throws, the SDK treats it as `authTokenUnauthorized`
- The JWT must have an `exp` claim — the SDK reads it to detect expiry client-side
- In production, the JWT must have an `aud` claim — the SDK reads it to determine the API base URL

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

case .authTokenUnauthorized:

    // Auth token was rejected (401) — get a fresh token from your backend

case .accountLinkingError(let reason):

    // Merchant account needs to be linked in Settings → Wallet & Apple Pay

case .tokenError(let reason, let detail):

    // Connection token issue — might need a fresh token from your backend

case .readerError(let reason, let detail):

    // Card reader had a problem — usually retryable

case .locationError(let reason):

    // Location services unavailable — guide user to enable in Settings

    // reason tells you why: .servicesDisabled, .permissionDenied, .timeout, .unavailable

case .userCancelled:

    // Customer cancelled the payment

case .cardDeclined:

    // The card was declined by the issuer

case .offlineDeclined:

    // Transaction declined due to offline security validation

case .cardNotSupported:

    // Card not supported for this transaction type

default:

    print("Error: \(error.localizedDescription)")

}

```

### Detailed Error Messages

The SDK provides user-friendly error messages that follow Apple's Tap to Pay guidelines. The `errorMessage` parameter in `.declined` results contains the full message to display to users.

#### Device Not Supported Errors

These are returned as distinct `errorCode` values — no need to inspect `errorMessage` to disambiguate:

**`passcodeDisabled`** — No passcode set on device:
```swift
// errorMessage: "Tap to Pay on iPhone requires you to set a passcode on your device. To set a passcode, go to Settings > Face ID & Passcode or Settings > Touch ID & Passcode."
```
Consumer app should: Show alert with link to Settings → Face ID & Passcode

**`osVersionNotSupported`** — iOS version too old:
```swift
// errorMessage: "Tap to Pay on iPhone requires the latest version of iOS. To update, go to Settings > General > Software Update."
```
Consumer app should: Show alert with link to Settings → General → Software Update

**`modelNotSupported`** — Device model not capable:
```swift
// errorMessage: (generic error alert)
```
Consumer app should: Disable Tap to Pay features permanently for this device

**`unsupported`** — Unsupported hardware or configuration:
```swift
// errorMessage: (generic error alert)
```
Consumer app should: Show generic error alert

#### Timeout Errors

When `errorCode == HaloErrorCode.timeout`:

**User Didn't Tap Card (60s timeout):**
```swift
// errorMessage: "Payment session timed out"
```
Consumer app should: Allow retry - user may need guidance on tapping card

#### Phone Call and App Interruption Errors

#### Phone Call and App Interruption Errors

**`readNotAllowedDuringCall`** — Phone call in progress :
```swift
// errorMessage: "Tap to Pay on iPhone can't be used while a call is in progress."
```
Consumer app should: Show alert — user must end the call first before retrying

**`requestInterrupted`** — App interrupted during read (notification, system dialog, Face ID, etc.):
```swift
// errorMessage: "Tap to Pay on iPhone was interrupted. If you're on a call, end it and try again."
```
Consumer app should: Show alert and allow retry — note: the message mentions a call, but this error can also occur from non-call interruptions. Apple does not provide enough context to distinguish the cause.


**`backgroundRequestNotAllowed`** — App went to background during init or payment:
```swift
// errorMessage: (generic error alert)
```
Consumer app should: Bring app to foreground and retry — do not show modal alert if triggered from background init

#### Network Errors

**`networkError` / `networkAuthenticationError` / `serviceConnectionError`**:
```swift
// errorMessage: "Tap to Pay on iPhone requires your phone to be connected to the internet. Check your network settings and try again."
```
Consumer app should: Show alert with option to retry when connectivity restored

#### Reader Errors

**`readerMemoryFull`**:
```swift
// errorMessage: "Reader memory is full. Please remove one or more cards from Apple Wallet and try again."
```
Consumer app should: Guide user to remove cards from Apple Wallet, then retry

**`prepareFailed`** — Reader preparation failed (including attestation failures on app launch):
```swift
// errorMessage: "Failed to prepare the card reader."
```
Consumer app should: Check `errorMessage` for specific guidance. Common causes include network unavailability during attestation (error 2023), iOS configuration incompatibility (error 2031), and secure pairing violations. The SDK now correctly identifies this as a reader error rather than a generic system error.

**`prepareFailed`** — iOS configuration incompatible (error 2031):
```swift
// errorMessage: "Tap to Pay on iPhone requires the latest version of iOS. To update, go to Settings > General > Software Update."
```
Consumer app should: Show alert with link to iOS update

**`prepareFailed`** — Software update issue (error 2033):
```swift
// errorMessage: "A software update issue occurred. Please reinstall iOS using a computer. Contact support for assistance."
```
Consumer app should: Show support contact information

**`prepareFailed`** — Secure pairing violation:
```swift
// errorMessage: "A hardware issue was detected. Please bring your device to an Apple Store for diagnostic and repair."
```
Consumer app should: Show Apple Store locator or support contact

**`readerBusy` / `notReady` / `prepareExpired`**:
```swift
// errorMessage: (generic error alert)
```
Consumer app should: Allow retry — usually transient

#### Account Linking Errors

Each account linking outcome now has its own distinct `errorCode`. The SDK automatically calls `linkAccount()` to present Apple's account linking UI — no manual intervention is required.

| `errorCode` | Meaning | What to do |
|---|---|---|
| `accountNotLinked` | Account not yet linked | SDK handles automatically |
| `accountLinkingCancelled` | User cancelled linking UI | Prompt to retry payment |
| `accountLinkingFailed` | Linking failed after retries | Show: "An error occurred while linking the Apple Account for Tap to Pay on iPhone. Try again with a different Apple Account." |
| `accountLinkingCheckFailed` | Status check failed | Show generic error alert |
| `accountLinkingRequiresiCloudSignIn` | iCloud sign-in needed | Show: "Tap to Pay on iPhone requires you to sign in with an Apple Account. To sign in, go to Settings > Sign in to your iPhone." |
| `accountAlreadyLinked` | Already linked | No action needed |
| `accountDeactivated` | Account deactivated | Show generic error alert |

#### System Errors (Transient)

When `errorCode == HaloErrorCode.systemError`:
```swift
// errorMessage: (generic error alert)
```
SDK automatically retries once — consumer app should wait for retry result, then allow user to restart payment

#### Device Banned

When `errorCode == HaloErrorCode.deviceBanned`:
```swift
// errorMessage: Apple-provided ban message (includes ban expiry date if applicable)
```
Consumer app should: Disable Tap to Pay and show support contact

#### Token Errors

| `errorCode` | Meaning | What to do |
|---|---|---|
| `invalidReaderToken` | Invalid reader token | Check token generation in backend |
| `emptyReaderToken` | Empty reader token | Check token generation in backend |
| `tokenExpired` | Reader token expired | SDK will fetch fresh token automatically |

#### Merchant Errors

| `errorCode` | Meaning | What to do |
|---|---|---|
| `merchantBlocked` | Merchant blocked (exceeded device limit) | Show generic error alert — contact support |
| `invalidMerchant` | Invalid merchant configuration | "The merchant configuration is invalid. Please contact support to verify merchant enrollment." |
| `notAllowed` | Entitlement or configuration issue | Contact support to verify merchant enrollment |

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

```

### Complete Error Handling Example

Here's a comprehensive example of how to handle payment errors in your consumer app:

```swift

let result = await HaloSDK.startContactlessPayment(
    amountMinor: 2500,
    currency: "USD",
    merchantReference: "order_123"
)

switch result {
case .approved(let receipt):
    // Payment successful
    showSuccessScreen(receipt: receipt)
    
case .declined(let errorCode, let errorMessage):
    // Handle different error types
    switch errorCode {
    
    case HaloErrorCode.userCancelled:
        // User cancelled - optionally prompt to try again
        showCancellationPrompt()
        
    case HaloErrorCode.cardDeclined:
        // Card declined - ask for different payment method
        showAlert(
            title: "Card Declined",
            message: "Please try a different card or payment method."
        )
        
    case HaloErrorCode.networkError:
        // Network issue - show Apple's recommended message
        showAlert(
            title: "Network Error",
            message: errorMessage ?? "Check your internet connection and try again."
        )
        
    case HaloErrorCode.timeout:
        // User didn't tap card in time (60s)
        showRetryPrompt(message: "Payment timed out. Please try again.")
        
    case HaloErrorCode.passcodeDisabled:
        showAlert(
            title: "Passcode Required",
            message: errorMessage,
            action: openSettings
        )
        
    case HaloErrorCode.osVersionNotSupported:
        showAlert(
            title: "iOS Update Required",
            message: errorMessage,
            action: openSettings
        )
        
    case HaloErrorCode.modelNotSupported,
         HaloErrorCode.unsupported:
        // Device incompatible - disable feature
        disableTapToPay()
        
    case HaloErrorCode.readNotAllowedDuringCall,
         HaloErrorCode.requestInterrupted:
        // Phone call in progress - show Apple's recommended alert
        showAlert(
            title: "Phone Call in Progress",
            message: errorMessage ?? "Tap to Pay on iPhone can't be used while a call is in progress.",
            buttons: [.ok]
        )
        
    case HaloErrorCode.backgroundRequestNotAllowed:
        // App was backgrounded - bring to foreground and retry
        showRetryPrompt(message: errorMessage)
        
    case HaloErrorCode.readerMemoryFull:
        showAlert(
            title: "Reader Memory Full",
            message: errorMessage
        )
        
    case HaloErrorCode.prepareFailed:
        // Check errorMessage for hardware/software specific guidance
        showAlert(
            title: "Setup Failed",
            message: errorMessage ?? "An error occurred. Please try again."
        )
        
    case HaloErrorCode.readerBusy,
         HaloErrorCode.notReady,
         HaloErrorCode.prepareExpired:
        // Transient reader state - allow retry
        showRetryPrompt(message: errorMessage)
        
    case HaloErrorCode.accountLinkingCancelled:
        // User cancelled the linking UI - they can retry payment
        showRetryPrompt(message: "Account linking was cancelled. Would you like to try again?")
        
    case HaloErrorCode.accountLinkingFailed:
        showAlert(
            title: "Account Linking Failed",
            message: errorMessage ?? "Unable to link your account. Please contact support if this persists."
        )
        
    case HaloErrorCode.accountLinkingRequiresiCloudSignIn:
        showAlert(
            title: "Sign in to Apple Account",
            message: errorMessage,
            action: openSettings
        )
        
    case HaloErrorCode.locationError:
        // Location permission needed
        showAlert(
            title: "Location Access Required",
            message: "Please enable location access in Settings.",
            action: openSettings
        )
        
    case HaloErrorCode.authTokenUnauthorized:
        // Token provider broken
        showAlert(
            title: "Authentication Error",
            message: "Please restart the app or contact support."
        )
        
    case HaloErrorCode.deviceBanned:
        // Device banned
        showAlert(
            title: "Device Unavailable",
            message: errorMessage ?? "Please contact support."
        )
        disableTapToPay()
        
    case HaloErrorCode.merchantBlocked,
         HaloErrorCode.invalidMerchant,
         HaloErrorCode.notAllowed:
        // Merchant configuration issue
        showAlert(
            title: "Tap to Pay on iPhone Unavailable",
            message: "An error occurred while starting Tap to Pay on iPhone. Try again later. If the error persists, contact support.",
            buttons: [.contactSupport, .close]
        )
        
    case HaloErrorCode.systemError:
        // Transient error - SDK may have auto-retried
        showRetryPrompt(message: errorMessage)
        
    default:
        // Generic error - show message
        showAlert(
            title: "Payment Failed",
            message: errorMessage ?? "An error occurred. Please try again."
        )
    }
}

// Helper functions
func openSettings() {
    if let url = URL(string: UIApplication.openSettingsURLString) {
        UIApplication.shared.open(url)
    }
}

func disableTapToPay() {
    // Disable Tap to Pay UI elements permanently
}

func showRetryPrompt(message: String? = nil) {
    let alert = UIAlertController(
        title: "Payment Failed",
        message: message ?? "Would you like to try again?",
        preferredStyle: .alert
    )
    alert.addAction(UIAlertAction(title: "Try Again", style: .default) { _ in
        // Restart payment
    })
    alert.addAction(UIAlertAction(title: "Cancel", style: .cancel))
    present(alert, animated: true)
}

```

### Handling Auth Token Rejection

The SDK automatically refreshes tokens — you typically don't need to handle this yourself. Here's what happens under the hood:

1. **Before each request**, the SDK checks the cached JWT's `exp` claim. If expired (or within 30 seconds of expiry), it calls your token provider for a fresh one.

2. **If the backend returns 401 anyway** (clock skew, revocation, etc.), the SDK clears the cache, calls your provider again, and retries the request once.

3. **If the retry also fails**, the SDK returns `authTokenUnauthorized`.

So when you see `authTokenUnauthorized`, it means your token provider itself is broken — the SDK already tried twice. Check your provider implementation:

```swift

case .declined(let errorCode, let errorMessage):

    if errorCode == HaloErrorCode.authTokenUnauthorized {

        // SDK already tried twice with your provider — something's wrong with it
        // Check: Is your backend returning valid JWTs?
        // Check: Is the JWT's `exp` claim correct?
        // Check: Are you using the right environment (sandbox vs production)?

        showAlert(title: "Authentication Error",
                  message: "Please restart the app or contact support")

    }

```

**When this happens:**

- Your token provider is returning invalid or expired JWTs
- Your backend is down or returning errors
- JWT signature is invalid or malformed
- Wrong environment (sandbox token in production or vice versa)

### Event Delegate

The SDK notifies your app about errors, reader preparation progress, and analytics/timeline events through a delegate. Applications should display clear preparation status while Tap to Pay on iPhone is being configured. The delegate provides preparation progress and readiness callbacks to support this.

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

    // Called whenever the SDK emits an analytics event
    // Use this to build a per-payment timeline or send to your analytics backend.
    func haloSDK(didEmitAnalyticsEvent event: HaloAnalyticsEvent) {

        var properties: [String: Any] = [
            "type": event.type.rawValue,
            "timestamp": event.timestamp.timeIntervalSince1970
        ]

        // Merge metadata into analytics properties
        for (key, value) in event.metadata {
            properties[key] = value
        }

        Analytics.track("halo_payment_timeline", properties: properties)
    }

}

// Set it up early, before or right after initialization

HaloSDK.setEventDelegate(PaymentHandler())

```

Preparation progress callbacks are triggered during SDK initialization and whenever the system needs to prepare or re-prepare Tap to Pay on iPhone (for example after app foregrounding or a configuration change). Applications should be prepared to receive these callbacks more than once during the app lifecycle.

### Performance Logging

The SDK can accumulate analytics events during each payment flow and send them to the backend at the end of the flow. This feature is **disabled by default** because most customer backends do not host the required endpoint.

To enable performance logging, pass `enablePerformanceLogging: true` during initialization:

```swift

try await HaloSDK.initialize(
    tokenProvider: myProvider,
    environment: .production,
    enablePerformanceLogging: true
)

```

Only enable this if your backend supports the `/apple/performance-testing` endpoint. When disabled, no performance events are accumulated or sent, and there is no impact on payment flows or analytics delegate events.

When enabled, events are collected across three flow types:
- **T&C acceptance**: `connectionTokenRequested` through `termsAccepted`
- **Device configuration**: `connectionTokenRequested` through `readerPrepareCompleted`
- **Transaction**: `paymentStarted` through `paymentApproved` / `paymentDeclined` / `paymentCancelled` / `paymentError`

The accumulated events are sent to:
```
POST /apple/performance-testing
```

With headers:
- `X-Device-Installation-Id` — Unique device identifier
- `X-Correlation-Id` — Unique ID for this payment flow
- `Authorization` — Bearer token

Payload:
```json
{
    "correlationId": "8d101b46-e203-43d9-bea6-233ce3a7050b",
    "messages": [
        {"timestamp": "2026-03-04T09:50:38.679Z", "message": "paymentStarted"},
        {"timestamp": "2026-03-04T09:50:38.879Z", "message": "paymentValidated"},
        {"timestamp": "2026-03-04T09:50:39.679Z", "message": "readyForTap"},
        {"timestamp": "2026-03-04T09:50:41.679Z", "message": "cardDetected"},
        {"timestamp": "2026-03-04T09:50:45.879Z", "message": "paymentApproved"}
    ]
}
```

This allows backend correlation of payment flow timing with server-side logs for troubleshooting.

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

This stops the card reader and ends the current payment attempt. The `startContactlessPayment` call will return `.declined(errorCode: "userCancelled", errorMessage: "Payment cancelled by user")`.

Applications should call cancelPayment() only in response to a clear user action or application-level timeout. The SDK automatically cancels the payment if required by system, security, or lifecycle conditions, and applications do not need to handle those cases explicitly.

## Processing Refunds

To process a refund, pass `type: .refund` to `startContactlessPayment`. The customer taps their card again, and Apple's reader shows "Refund" instead of "Pay".

```swift

let result = await HaloSDK.startContactlessPayment(

    amountMinor: 500,              // refund amount in cents

    currency: "ZAR",

    merchantReference: "refund_order_12345",

    type: .refund

)

switch result {

case .approved(let receipt):

    print("Refund processed: \(receipt.transactionId)")

case .declined(let errorCode, let errorMessage):

    print("Refund failed: \(errorMessage ?? "Unknown error")")

}

```

**Gotchas:**

- The card must be physically present — this isn't a "card-not-present" refund

- Use your own reference linking (e.g., `refund_order_12345`) to tie refunds to original transactions

## Security Validation

The SDK performs automatic security validation on purchase transactions to ensure compliance with payment standards. Transactions may be declined offline based on card data analysis.

```swift

switch result {

case .declined(let errorCode, let errorMessage):

    if errorCode == HaloErrorCode.offlineDeclined {

        // Transaction declined due to security validation

        // This occurs when Cryptogram Information Data (tag 9F27) equals "00" 

        // Only affects purchase transactions, not refunds

        print("Payment declined due to security validation")

    }

}

```

**Behavior:**

- **Purchase transactions** are validated and may be declined if Cryptogram Information Data = 00
- **Refund transactions** are NOT affected by this validation
- **Performance conscious** - validation runs asynchronously to avoid blocking the UI
- **Sandbox logging** - detailed decline reasons are logged only in sandbox environment
- **Production security** - generic messages shown in production to prevent information leakage

**When this happens:**

The SDK analyzes the card's TLV (Tag-Length-Value) data immediately after card read. If a purchase transaction contains Cryptogram Information Data (tag 9F27) with value "00", the transaction is declined before backend submission to prevent potential fraud.

## Cleanup

When you're done with the SDK (user logs out, switching accounts, etc.):

```swift

HaloSDK.deinitialize()

```

This clears all cached tokens and resets the SDK state. You'll need to call `initialize()` again before accepting more payments.

## Location Permissions

The SDK requires device location for all transaction requests as a fraud prevention and security measure. **Location access is mandatory** — payments cannot proceed without it.

### Required Configuration

Add this key to your app's `Info.plist`:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Location access is required to process payments securely and prevent fraud.</string>

```

**Important**: Without this Info.plist entry, iOS will not show the location permission dialog, and all payment attempts will fail.

### How Location Works

1. **First payment**: When a user initiates their first payment, iOS shows a system permission dialog asking for location access
2. **Permission granted**: The SDK captures coordinates and includes them in the `X-Location` header for all subsequent payments
3. **Permission denied**: The payment fails immediately with a `locationError` error code before Apple's card reader UI appears
4. **Subsequent payments**: If permission was previously granted, location is captured automatically with no additional prompts

### Location Error Handling

When location is unavailable or denied, the SDK returns a `.declined` result with `errorCode: HaloErrorCode.locationError`:

```swift

case .declined(let errorCode, let errorMessage):

    if errorCode == HaloErrorCode.locationError {

        // Location permission denied or unavailable

        // Guide user to enable location in Settings

        showLocationSettingsAlert()

    }

```

### Location Error Reasons

The SDK provides specific reasons for location failures via `HaloError.locationError(reason:)`:

- **`.servicesDisabled`**: Location Services are disabled in device Settings
- **`.permissionDenied`**: User denied location permission for this app
- **`.timeout`**: Location request timed out (user didn't respond to permission dialog)
- **`.unavailable`**: Location data unavailable for other reasons

### Best Practices

**1. Pre-request location permission (Recommended)**

To avoid the permission dialog appearing during the payment flow, request location permission earlier (e.g., during onboarding or app launch):

```swift

import CoreLocation

func requestLocationPermissionEarly() {

    let status = CLLocationManager().authorizationStatus

    if status == .notDetermined {

        // Request permission before first payment

        CLLocationManager().requestWhenInUseAuthorization()

    }

}

```

**2. Provide clear guidance when permission is denied**

```swift

func showLocationSettingsAlert() {

    let alert = UIAlertController(

        title: "Location Access Required",

        message: "To process payments securely, please enable location access in Settings > Privacy & Security > Location Services.",

        preferredStyle: .alert

    )

    alert.addAction(UIAlertAction(title: "Open Settings", style: .default) { _ in

        if let settingsURL = URL(string: UIApplication.openSettingsURLString) {

            UIApplication.shared.open(settingsURL)

        }

    })

    alert.addAction(UIAlertAction(title: "Cancel", style: .cancel))

    present(alert, animated: true)

}

```

**What happens with location:**

- If granted: Location coordinates are sent in the `X-Location` header in format `"accuracy;longitude;latitude"`

- If denied: Payment fails immediately with `locationError` before card reader UI appears

- If not determined: SDK requests permission automatically when payment starts

- The SDK handles location with a 5-second timeout to avoid blocking the payment flow

## Transaction Flow

When you call `startContactlessPayment()`, here's what happens under the hood:

1. **Card read** — Apple's ProximityReader captures encrypted card data

2. **Backend submission** — SDK sends the encrypted data to your payment processor via `POST /transactions/apple`

3. **PIN Resubmission (Single Tap + PIN)** — For transactions requiring PIN verification, the SDK uses `POST /transactions/{originalTransactionID}/submitPinApple` with PIN-encrypted data

4. **Result mapping** — Backend response is mapped to `HaloPaymentResult`

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

    receipt.cardBrand        // Card scheme (Visa, Mastercard, etc.)

    receipt.cardType         // Card product type (Debit, Credit, etc.)

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

**Location permission denied or LOCATION_ERROR**

Location access is required for all payments. If you're seeing `LOCATION_ERROR`:

1. Check that `NSLocationWhenInUseUsageDescription` is in your Info.plist
2. If the user denied permission, they must enable it manually in Settings → Your App → Location
3. Consider pre-requesting location permission during app launch or onboarding to avoid payment-time prompts
4. The SDK validates location before showing Apple's card reader UI, so users get immediate feedback if location is unavailable

**Location not being sent with transactions**

Check that you've added `NSLocationWhenInUseUsageDescription` to your Info.plist. If the user previously denied location permission, they'll need to enable it manually in Settings → Your App → Location. The SDK won't prompt again after a denial.

**"PPS-4003" or "Request Expired" error**

The encrypted card data must be submitted to the backend within 60 seconds of the card tap. If you're seeing this error, there may be network delays or the payment flow is taking too long. The SDK handles this automatically, but slow network conditions can cause timeouts.

**AUTH_TOKEN_UNAUTHORIZED or "Authentication token rejected" error**

The SDK automatically refreshes expired tokens, so if you're seeing this error, your **token provider** is the problem — not just an expired token. The SDK tried twice (once proactively, once on 401 retry) and both attempts failed.

Check your token provider:

- Is your backend returning valid JWTs with an `exp` claim?
- Is the `exp` timestamp correct (not already in the past)?
- Are you using the correct environment (sandbox token for sandbox, production for production)?
- Is your backend reachable and returning 200 responses?

The SDK reads the JWT's `exp` claim client-side and refreshes proactively — so even clock skew of a few minutes shouldn't cause issues. If you're still getting this error, add logging to your token provider to see what's being returned.

Your auth token was rejected by the backend (HTTP 401). This usually means:

- The token has expired — fetch a fresh one from your backend and call `HaloSDK.initialize()` again
- You're using a sandbox token in production (or vice versa) — make sure the token matches your environment
- The token signature is invalid — verify your backend is signing tokens correctly
- The token was revoked server-side — check with your payment provider

The SDK sets `error.requiresTokenRefresh = true` for this error, so you can catch it alongside other token issues.
