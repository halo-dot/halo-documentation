---
sidebar_class_name: hidden
---

# Halo UI SDK for Android

[![Platform](https://img.shields.io/badge/platform-Android-green.svg)](https://developer.android.com)
[![Min SDK](https://img.shields.io/badge/minSDK-29-blue.svg)](https://android-arsenal.com/api?level=29)
[![Compose](https://img.shields.io/badge/UI-Jetpack%20Compose-orange.svg)](https://developer.android.com/jetpack/compose)

The **Halo UI SDK** provides a ready-made, Jetpack Compose-based interface for integrating Halo payment services into your Android application. It handles the transaction flow, card reading animations, and status reporting, so you can focus on your core business logic.

## Features

- **Ready-to-use UI**: Fullscreen transaction flow including amount entry, card reading, and success/failure states
- **Theming**: Light mode, dark mode, custom colors, shapes, and company logo
- **Simple API**: Launch a transaction and receive the result via Kotlin Coroutines
- **Dynamic Currency Conversion (DCC)**: Optional currency-selection screen letting the cardholder pay in their own currency
- **Localization**: Built-in translations for English, Afrikaans, Zulu, French, German, Spanish, and Portuguese — follows the device language by default

## Prerequisites

- **Android 10.0 (API level 29)** or higher
- **Halo SDK Credentials**: A valid SDK token provided by Synthesis/Halo
- A `ComponentActivity` (or subclass such as `AppCompatActivity`) to host the SDK

## Installation

### 1. Configure Credentials

When you register on the developer portal, we generate an AWS access key and secret key for you. These are sensitive and should not be committed to source control.

Add them to your project's `local.properties`:

```properties
aws.accessKey={{your_access_key}}
aws.secretKey={{your_secret_key}}
```

### 2. Configure Repositories

In your `settings.gradle.kts`, load the properties and add the Halo repository:

```kotlin
import java.util.Properties

val localProperties = Properties().apply {
    val localPropertiesFile = rootDir.resolve("local.properties")
    if (localPropertiesFile.exists()) {
        localPropertiesFile.inputStream().use { load(it) }
    }
}

dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
        maven {
            name = "releases"
            url = uri("s3://synthesis-halo-artifacts/releases")
            credentials(AwsCredentials::class) {
                accessKey = localProperties.getProperty("aws.accesskey")
                secretKey = localProperties.getProperty("aws.secretkey")
            }
        }
    }
}
```

### 3. Add Dependency

Add the following to your module's `build.gradle.kts`, replacing `0.0.1` with the latest version:

```kotlin
dependencies {
    implementation("za.co.synthesis.halo:sdk_ui:0.0.1")
}
```

Both debug and release variants are published under this single coordinate. Gradle selects the right one automatically from its module metadata — your **debug** build pulls the debug SDK, your **release** build pulls the production SDK — so you don't declare anything variant-specific.

## Permissions

The SDK's permissions are automatically merged into your app's manifest, and the required runtime permissions (camera, location, phone state, and Bluetooth on Android 12+) are requested automatically when `HaloSdkUi.init()` is called.

| Permission | Purpose |
|------------|---------|
| `INTERNET` | Network communication with the Halo backend |
| `NFC` | Reading payment cards |
| `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION` | Payment compliance (location verification) |
| `CAMERA` | Device security verification |
| `READ_PHONE_STATE` | Device identification |
| `BLUETOOTH_SCAN` / `BLUETOOTH_CONNECT` | External card reader support (Android 12+) |
| `VIBRATE` / `MODIFY_AUDIO_SETTINGS` | Feedback on card tap |

<hr/>

## Configuration

### Initialization

Initialize the SDK once, typically in your main activity's `onCreate`. The activity passed to `HDConfig` **must** be a `ComponentActivity` (or subclass such as `AppCompatActivity`), since the SDK renders its UI with Jetpack Compose.

**HDConfig parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `activity` | `ComponentActivity` | - | The activity that will host the SDK UI. |
| `merchantDetails` | `HDMerchantDetails` | - | Your app and company details. |
| `onTokenRequest` | `() -> String` | - | Callback that must return a valid Halo SDK token. |
| `showTransactionResult` | `Boolean` | `false` | Whether to show the SDK's built-in success/failure screens. |
| `theme` | `HDTheme` | `HDTheme()` | Colors, shapes, and logo configuration. |
| `themeMode` | `HaloThemeMode` | `SYSTEM` | Force light, dark, or follow the system theme. |
| `schemeLogos` | `HDSchemeLogos` | `HDSchemeLogos()` | Which card scheme logos are shown. |
| `showDCC` | `Boolean` | `false` | Enable Dynamic Currency Conversion — see [DCC](#dynamic-currency-conversion-dcc). |
| `language` | `HDLanguage?` | `null` | Pins the SDK language — see [Languages](#languages). |

#### HDMerchantDetails parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `packageName` | `String` | Your app's package name (e.g., `applicationContext.packageName`) |
| `packageVersion` | `String` | Your app's version name (e.g., `"1.0.0"`) |
| `merchantName` | `String` | Display name of your company shown in the SDK header |

```kotlin
import za.co.synthesis.halo.sdk_ui.HaloSdkUi
import za.co.synthesis.halo.sdk_ui.models.HDConfig
import za.co.synthesis.halo.sdk_ui.models.HDMerchantDetails

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val config = HDConfig(
            activity = this,
            merchantDetails = HDMerchantDetails(
                packageName = packageName,
                packageVersion = BuildConfig.VERSION_NAME,
                merchantName = "My Awesome App",
            ),
            onTokenRequest = {
                // Return your Halo SDK token here (e.g., fetch from your backend)
                "YOUR_SDK_TOKEN"
            },
        )

        val success = HaloSdkUi.init(config)
    }
}
```

`init` returns `false` if initialization fails.

### Theming

Define your brand's colors, shapes, and logo using `HDTheme` and pass it to `HDConfig`.

**HDTheme properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `light` | `HDColorScheme` | `HDColorScheme.default()` | Color scheme for light mode |
| `dark` | `HDColorScheme` | `HDColorScheme.defaultDark()` | Color scheme for dark mode |
| `shape` | `Dp` | `16.dp` | Corner radius for buttons and containers |
| `paddingHorizontal` | `Dp` | `24.dp` | Horizontal padding inside containers |
| `paddingVertical` | `Dp` | `12.dp` | Vertical padding inside containers |
| `logo` | `HDCompanyLogo` | `HDCompanyLogo()` | Company logo configuration |

**HDColorScheme properties:**

| Property | Type | Description |
|----------|------|-------------|
| `primary` | `Color` | Main brand color (buttons, highlights) |
| `secondary` | `Color` | Secondary accent color |
| `surface` | `Color` | Background color |
| `onSurface` | `Color` | Text/icon color on surface |
| `onPrimary` | `Color` | Text/icon color on primary background |
| `outline` | `Color` | Border and divider color |
| `error` | `Color` | Error/decline color |

**HDCompanyLogo properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `lightMode` | `String?` | `null` | URL or path to the logo for light mode |
| `darkMode` | `String?` | `null` | URL or path to the logo for dark mode |
| `aspectRatio` | `Float?` | `null` | Optional aspect ratio for the logo |

```kotlin
import za.co.synthesis.halo.sdk_ui.models.HDTheme
import za.co.synthesis.halo.sdk_ui.models.HDColorScheme
import za.co.synthesis.halo.sdk_ui.models.HDCompanyLogo
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

val myCustomTheme = HDTheme(
    light = HDColorScheme.default().copy(
        primary = Color(0xFF6200EE),
        onPrimary = Color.White,
    ),
    dark = HDColorScheme.defaultDark().copy(
        primary = Color(0xFFBB86FC),
    ),
    shape = 12.dp,
    logo = HDCompanyLogo(lightMode = "https://example.com/logo.png"),
)

val config = HDConfig(
    // ... other props
    theme = myCustomTheme,
)
```

The theme mode (`HaloThemeMode.LIGHT`, `DARK`, or `SYSTEM`) is set via `HDConfig` and can also be changed at runtime:

```kotlin
import za.co.synthesis.halo.sdk_ui.events.HaloThemeMode

HaloSdkUi.setThemeMode(HaloThemeMode.DARK)
```

### Languages

The SDK UI ships translations for English (`en`), Afrikaans (`af`), Zulu (`zu`), French (`fr`), German (`de`), Spanish (`es`), and Portuguese (`pt`). By default it follows the device language, falling back to English for unsupported locales. To pin a specific language:

```kotlin
import za.co.synthesis.halo.sdk_ui.core.HDLanguage

val config = HDConfig(
    // ... other props
    language = HDLanguage.AFRIKAANS,
)
```
```kotlin
HaloSdkUi.setLanguage(HDLanguage.ENGLISH)
```


### Scheme Logos

Control which payment scheme logos are displayed using `HDSchemeLogos`. All logos (`nfc`, `visa`, `mastercard`, `amex`, `discover`, `elo`) are enabled by default.

```kotlin
import za.co.synthesis.halo.sdk_ui.models.HDSchemeLogos

val config = HDConfig(
    // ... other props
    schemeLogos = HDSchemeLogos(amex = false, discover = false),
)
```

## Usage

### Launching a Transaction

`HaloSdkUi.launch` is a suspend function that opens the SDK UI and returns when the transaction completes.

| Parameter | Type | Description |
|-----------|------|-------------|
| `amount` | `BigDecimal?` | The transaction amount. If `null` or zero, the SDK shows a keypad for the user to enter the amount. |
| `merchantRef` | `String?` | Optional merchant reference. If `null`, the user can enter one on the keypad screen; otherwise the SDK generates one. |
| `currency` | `HDCurrency?` | The transaction currency (`HDCurrency.ZAR`, `USD`, `EUR`, or `GBP`). Defaults to `ZAR` if `null`. |

If you already know the amount, the SDK skips the keypad and goes directly to the "Tap Card" screen:

```kotlin
import za.co.synthesis.halo.sdk_ui.HaloSdkUi
import za.co.synthesis.halo.sdk_ui.models.HDCurrency
import java.math.BigDecimal

fun startPayment(amount: BigDecimal) {
    lifecycleScope.launch {
        val result = HaloSdkUi.launch(
            amount = amount,
            merchantRef = "REF-9921",
            currency = HDCurrency.ZAR,
        )
        handleResult(result)
    }
}
```

Pass `amount = null` to let the user enter the amount (and optionally a reference) on the keypad first.

### Dynamic Currency Conversion (DCC)

> **Note**: DCC is under active development — the flow currently runs on placeholder rates.

With `showDCC = true` in `HDConfig`, the SDK offers the cardholder a choice of currency after their card is read:

1. A **currency-selection screen** shows the amount in the local currency and in the card's currency, along with the exchange rate and conversion margin.
2. The cardholder picks one and the transaction completes in that currency.
3. The success screen then includes the DCC details: local total, exchange rate, margin, transaction currency, and the total transaction amount in the chosen currency.

```kotlin
val config = HDConfig(
    // ... other props
    showDCC = true,
)
```

### Handling Results

`launch` returns a `HaloTransactionResult?` containing a `resultType`, transaction references, and (for completed transactions) a `receipt`.

> **Note**: If `showTransactionResult` is `false` in `HDConfig` (the default), the SDK returns the result as soon as the transaction completes, without showing its own success/failure screens. Set it to `true` to show the built-in result screens.

Common result types:

| Type | Description |
|------|-------------|
| `Approved` | Transaction was successful |
| `Declined` | Payment was declined by the bank or issuer |
| `Cancelled` | User closed the SDK before completion |
| `CardTapTimeOutExpired` | Card was not tapped in time |
| `NetworkError` / `ProcessingError` | A technical error occurred |

```kotlin
import za.co.synthesis.halo.haloCommonInterface.HaloTransactionResult
import za.co.synthesis.halo.haloCommonInterface.HaloTransactionResultType

fun handleResult(result: HaloTransactionResult?) {
    when (result?.resultType) {
        HaloTransactionResultType.Approved -> {
            println("Approved: ${result.merchantTransactionReference}")
        }
        HaloTransactionResultType.Declined -> {
            println("Declined")
        }
        HaloTransactionResultType.Cancelled -> {
            println("Cancelled by user")
        }
        else -> {
            println("Transaction status: ${result?.resultType}")
        }
    }
}
```
<hr/>

## Example Application

See the [example app](example-app/) for a complete working integration.

## License

Copyright © 2026 Halo Dot. All rights reserved.

Use of this SDK is subject to the Halo Terms of Service.

## 📞 Support

- **Documentation**: [Halo Developer Portal](https://docs.halodot.io/docs/category/intents)

---

*Made with ❤️ by the Halo Team*
