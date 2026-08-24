---
sidebar_class_name: hidden
---

# Halo UI SDK for Android

[![Platform](https://img.shields.io/badge/platform-Android-green.svg)](https://developer.android.com)
[![Min SDK](https://img.shields.io/badge/minSDK-29-blue.svg)](https://android-arsenal.com/api?level=29)
[![Compose](https://img.shields.io/badge/UI-Jetpack%20Compose-orange.svg)](https://developer.android.com/jetpack/compose)

The **Halo UI SDK** provides a ready-made, Jetpack Compose-based interface for integrating Halo payment services into your Android application. It handles the transaction flow, card reading animations, result screens and receipt delivery, so you can focus on your core business logic.

## 🚀 Features

- **Ready-to-use UI**: Fullscreen transaction flow including amount entry, card-reading animations, and success/failure screens
- **Theming**: Light mode, dark mode, custom colors, shapes, type sizes, and company logo
- **Simple API**: Initialize and launch a transaction with suspend functions — `init` waits for the SDK's real bring-up outcome, `launch` returns the transaction result
- **Digital receipts**: The cardholder's receipt is sent by the Halo kernel to an email address or mobile number the merchant enters
- **Inbound payment links**: App-to-app intents, custom-scheme URLs and your own App Link domain are handled natively by the SDK, with no host code involved
- **DebiCheck mandates**: A TT3 debit-order mandate arrives through the same doors as a payment and runs the same tap flow, with the order's terms on the screen the payer taps against — see [DebiCheck mandates](#debicheck-mandates)
- **Localization**: Built-in translations for English, Afrikaans, Zulu, French, German, Spanish, and Portuguese — follows the device language by default
- **Cross-runtime friendly**: Compose-free theme builders and a suspending token callback make the SDK straightforward to embed from a Flutter or React Native host

> **Note**: Dynamic Currency Conversion (DCC) is implemented but not yet exposed — the `showDCC` option is commented out in `HDConfig` while the flow is reworked. See [DCC](#dynamic-currency-conversion-dcc).

## 📋 Prerequisites

- **Android 10.0 (API level 29)** or higher
- **Halo SDK Credentials**: A valid SDK token provided by Synthesis/Halo
- A `ComponentActivity` (or subclass such as `AppCompatActivity`) to host the SDK

## 📦 Installation

### 1. Configure Credentials

When you register on the developer portal, we generate an AWS access key and secret key for you. These are sensitive and should not be committed to source control.

Add them to your project's `local.properties`:

```properties
aws.accesskey=< PROVIDED IN EMAIL >
aws.secretkey=< PROVIDED IN EMAIL >
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

Add the following to your module's `build.gradle.kts`, replacing `0.0.5` with the latest version:

```kotlin
dependencies {
    implementation("za.co.synthesis.halo:sdk_ui:0.0.5")
}
```

Both debug and release variants are published under this single coordinate. Gradle selects the right one automatically from its module metadata — your **debug** build pulls the debug SDK, your **release** build pulls the production SDK — so you don't declare anything variant-specific.

## 🛡️ Permissions {#permissions}

The SDK's permissions are merged into your app's manifest automatically. The runtime permissions among them are requested for you when `HaloSdkUi.init()` is called — you don't prompt for anything yourself. The prompt runs *alongside* the SDK's bring-up rather than in front of it, so a merchant answering it isn't also holding up the registration.

| Permission | Runtime prompt | Purpose |
|------------|----------------|---------|
| `INTERNET` | — | Network communication with the Halo backend |
| `NFC` | — | Reading payment cards |
| `VIBRATE` / `MODIFY_AUDIO_SETTINGS` | — | Feedback on card tap |
| `BLUETOOTH` / `BLUETOOTH_ADMIN` | — | External card reader support (pre-Android 12) |
| `CAMERA` | ✓ | Device security verification |
| `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION` | ✓ | Payment compliance (location verification) |
| `READ_PHONE_STATE` | ✓ | Device identification |
| `BLUETOOTH_SCAN` / `BLUETOOTH_CONNECT` | ✓ (Android 12+) | External card reader support |
| `POST_NOTIFICATIONS` | ✓ (Android 13+, at first notification) | Push to Terminal's notification, backgrounded — see below |

A denial doesn't abort bring-up — `init` continues and logs which permissions were refused, and the SDK reports the consequences through its own initialization result.

`POST_NOTIFICATIONS` is the one exception to "requested when `init()` is called": it plays no part in payment bring-up, so it is not in the batch above — Android prompts for it itself, automatically, the first time a pushed payment actually tries to post a notification. Refused, that payment waits for the merchant to next open the app rather than failing; nothing else about Push to Terminal is affected.

The SDK also declares a theme for the payment SDK's PIN pad activity (`PinScreenLauncherActivity`) on your behalf. Without it, a host whose application theme isn't AppCompat — a Flutter host, for instance — crashes the moment the kernel asks for a PIN, with the card already read. You need to do nothing; it is mentioned only so the extra `<activity>` in the merged manifest isn't a mystery.

## ⚙️ Configuration

### Initialization

Four calls, each at the earliest moment it is possible to make it:

```kotlin
HaloSdkUi.attach(this, savedInstanceState)       // first line of onCreate
HaloSdkUi.prepare(config)                        // at your splash
HaloSdkUi.init(config)                           // once you have a session token
HaloSdkUi.launch(amount, reference, currency, presentation)   // per charge
```

**The ordering is the point.** Each call needs strictly more than the one before it — `attach` needs nothing, `prepare` needs your config, `init` needs a session token — so each can run the moment that thing exists, and the work spreads across your startup instead of piling up in front of a merchant holding a card.

Skipping any of the first three is legal and costs only speed: the next one does its work as well. The SDK logs a warning if `attach` ran late.

Build one `HDConfig` and pass it to `prepare` and `init`. The activity it carries **must** be a `ComponentActivity` (or subclass such as `AppCompatActivity`), since the SDK renders its UI with Jetpack Compose.

**HDConfig parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `activity` | `ComponentActivity` | — | The activity that will host the SDK UI. |
| `onTokenRequest` | `suspend () -> String` | — | Suspending callback that must return a valid Halo SDK token. Because it's a suspend context, you can fetch the token from your backend (or bridge to another runtime) without blocking — and a plain, non-suspending lambda still fits, Kotlin converts it. |
| `presentation` | `HDPresentation` | `FULL_SCREEN` | How **inbound** payments are presented — full-screen, or as a sheet over your app. A charge you start says it per call on `launch`. See [Presentation](#presentation). |
| `theme` | `HDTheme` | `HDTheme()` | Colors, shapes, type sizes, and logo configuration. |
| `themeMode` | `HaloThemeMode` | `SYSTEM` | Force light, dark, or follow the system theme. |
| `schemeLogos` | `HDSchemeLogos` | `HDSchemeLogos()` | Which card scheme logos are shown. |
| `showTransactionResult` | `Boolean` | `true` | Whether the SDK shows its own success/failure screens before returning. Set `false` to have `launch` return the moment the transaction completes and present the outcome in your own UI. |
| `language` | `HDLanguage?` | `null` | Pins the SDK language — see [Languages](#languages). |
| `scheme` | `String` | `"halo"` | The custom scheme this brand's payment links arrive on. Must match the `halo_url_scheme` resource — see [Build configuration](#build-configuration). |
| `kernel` | `String?` | `null` | The Halo kernel short App Links are resolved against — see [Inbound payment links](#inbound-payment-links). |
| `kernelPins` | `Set<String>` | `emptySet()` | SHA-256 SPKI fingerprints for `kernel`'s TLS certificate. |
| `receivePush` | `Boolean` | `false` | Whether this device registers itself to receive Push to Terminal payments — see [Push to Terminal](#push-to-terminal). |

> **Not yet exposed**: `showDCC` (Dynamic Currency Conversion) is commented out in `HDConfig` while the flow is reworked — see [DCC](#dynamic-currency-conversion-dcc).

Your app's package name and version are read from the platform — you don't supply them.

```kotlin
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import za.co.synthesis.halo.sdk_ui.HaloSdkUi
import za.co.synthesis.halo.sdk_ui.models.HDConfig

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 1. First line. Loads the payment kernel — needs nothing from you.
        HaloSdkUi.attach(this, savedInstanceState)

        val config = HDConfig(
            activity = this,
            onTokenRequest = {
                // Return your Halo SDK token here (e.g., fetch from your backend).
                // This runs in a suspend context, so a network call needs no extra plumbing.
                "YOUR_SDK_TOKEN"
            },
        )

        // 2. At your splash. Needs your config but no token, returns immediately.
        HaloSdkUi.prepare(config)

        // 3. As soon as you have a session token — right after login.
        lifecycleScope.launch {
            val result = HaloSdkUi.init(config)
            Log.d("Halo", "SDK init: ${result?.resultType} (${result?.errorCode})")
        }
    }
}
```

#### `attach(activity, savedInstanceState)` — the first line of `onCreate`

Hands the SDK its Android context: the payment kernel, overlay protection, entropy.

**This is the single most expensive step of bringing the SDK up, and it must run before anything else your app does.** Not at your splash, not after your own setup — first, immediately after `super.onCreate`. It needs nothing from you but the Activity, so everything your app does afterwards runs against a payment stack that is already loading. Anywhere later and the cost simply lands on whoever is waiting next.

It also wires the Android lifecycle through to the SDK, which is part of the underlying SDK's integration contract — you do **not** forward `onStart` / `onResume` / `onPause` / `onStop` yourself.

Pass `savedInstanceState` straight through so the SDK can restore its own state across a process death. Cheap to call more than once.

#### `prepare(config)` — call it at your splash

Not a suspend function, returns immediately, and cannot fail in a way you have to handle. It:

- **caches the appearance half of your config** (theme, language, scheme logos, scheme, kernel) — that cache is what lets an inbound payment link, which brings the SDK up natively with no host in the process, still show your branding and speak your language.
- loads the translations and warms the tap screen's artwork in the background.

It's cheap, because the expensive part was `attach` and that has already happened. What it buys is an inbound payment that looks like your app, and a tap screen whose first frame touches no disk.

#### `init(config)` — call it as soon as you have a token

A **suspend** function — call it from a coroutine (e.g. `lifecycleScope.launch`). It registers the device (re-attesting only when the token's identity has changed since last time), brings the SDK up, and suspends until the SDK reports its *real* outcome: registered, attested, initialized, kernel settled. Runtime permissions are requested alongside it, not before it. It returns a `HaloInitializationResult?`:

- A non-null result carries the outcome — inspect its `resultType` / `errorCode` to see *why* bring-up failed (e.g. an attestation or security failure).
- A `null` result means setup failed before the SDK could report at all.

Because `init` waits for the true outcome, the host never discovers a dead SDK mid-transaction — there's nothing extra to poll or listen for.

Call it the moment your login succeeds rather than from your payment screen: the merchant is almost certainly still navigating, and that is free time this can run in. It's idempotent, so calling it again from a payment screen as a backstop costs nothing.

Pass the **same `config`** to both calls. `prepare` caches the branding an inbound payment paints itself with and `init` registers against it; hand them different values and a payment arriving cold looks like a different app.

### Presentation

`HDPresentation.FULL_SCREEN` (the default) is the SDK as its own app: an opaque activity that replaces yours for the length of a charge.

`HDPresentation.SHEET` presents the charge as a bottom sheet with your app dimmed behind it, so it reads as *your app asking for a card* rather than as another app taking over. It applies to the charge itself — bring-up, tap, the card-scheme animation, the currency choice, the result and the error screen — so nothing switches surface mid-card-read. The keypad and the detailed breakdown stay full-screen either way: one is a screen's worth of controls and the other a screen's worth of rows, and a sheet is a shape as well as a position.

**A sheet is the same screen, smaller.** Same parts, same order, same type hierarchy, laid out for a surface a few hundred dp tall rather than redrawn for it — and it takes the landscape arrangement in landscape, exactly as the full-screen style does.

There is one layout in the SDK, not one per screen and certainly not one per presentation. Every page declares three panes — a **heading** (what the page is about), a **body** (what it is for) and an optional **footer** — and the shell arranges them: stacked, or two panes side by side once the window is wider than it is tall. Pages state their sizes as a fraction of the room they are given, the SDK measures that room, and portrait, landscape and sheet all fall out of the same declaration. It is the same shell the Halo app uses for its own screens, for the same reason.

Two things are the sheet's own. It carries a **bar of its own at the top** — your logo on the left, and the buttons the full-screen style puts at the foot of the page as small actions on the right (Cancel, Share receipt, Charge), because two button heights out of a few hundred dp cost more than the choice is worth. And it is **one sheet for the whole charge**: the pages change inside it rather than each raising a sheet of its own, so bring-up handing over to tap is not a surface closing and another opening over your app.

Your logo sits leading in that bar rather than centred, as it is full-screen: the sheet's bar is a few hundred dp across with buttons at the other end, and a centred mark shifts every time the actions change width.

**One line, and nothing in your manifest:**

```kotlin
HaloSdkUi.launch(amount, merchantRef, currency, presentation = HDPresentation.SHEET)
```

**Stated per charge, with a config default for the ones you are not there to state.** `launch` takes its own `presentation`, so consecutive charges can differ — a quick tap as a sheet over the screen the merchant was on, the next one full-screen, and back again. `HDConfig.presentation` answers for the flows that arrive with no `launch` call at all: an app-to-app intent or a payment link.

A window's translucency is fixed when the window is created and there is no public API to change it, so the SDK ships *two* activities — the opaque `HDActivity` and the translucent `HDSheetActivity`, identical bar the theme — and launches whichever matches. A brand on the full-screen default never launches the translucent one, so the cost below is paid only by brands that asked for it.

**Know what it costs before choosing it.** A translucent window means your app is no longer *stopped* behind the payment surface — it keeps rendering for the whole transaction, next to a card read — and another app's pixels are visible behind a card-present screen, which is the shape overlay protection exists to catch (the SDK carries a `HaloErrorCode.OverlayDetected`). Both are reasonable trade-offs for a brand that has decided a sheet is the right experience.

Inbound payment links follow `HDConfig.presentation`, since they arrive with no `launch` call to ask — a brand that presents charges as a sheet looks the same however the charge arrived.

Swiping the sheet down, tapping the dimmed area and pressing back all raise a cancel confirmation — on the bring-up screen as well as on tap — and the sheet never simply closes, because an accidental swipe would otherwise abort a live card read.

"Powered by Halo Dot" sits at the foot of the sheet. It is a sheet's line rather than every screen's: inside your app the payment surface has to say whose it is, and full-screen the bar at the top has already said so. The card-scheme animation is full-bleed and carries neither, as it carries no top bar.

### SDK version

`HaloSdkUi.sdkVersion` returns the underlying Halo SDK's own version string, for a host that displays it (e.g. beside a link to the PCI listing the SDK is certified under). It's a property of the library, so it's readable before `attach`.

```kotlin
val version = HaloSdkUi.sdkVersion
```

### Device installation id

`HaloSdkUi.deviceInstallationId(context)` returns the Halo installation id for this app on this device — what the kernel knows the install by, and what a host has to present to register the device for Push to Terminal (`POST /devices`).

```kotlin
val installation = HaloSdkUi.deviceInstallationId(context)
```

It is `null` until the device has registered at least once, since the SDK is only handed the id inside `init`'s own device registration. From then on it survives launches and process deaths, so a later run gets it without registering again.

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
| `text` | `HDTextSizes` | `HDTextSizes()` | Type sizes — see [Text sizes](#text-sizes) |

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
| `asset` | `String?` | `null` | Path to a single logo asset that serves both light and dark modes. `null` uses the bundled Halo logo. |
| `icon` | `String?` | `null` | Path to your **square app mark** — the one on your launcher. Used where the SDK has one glyph's worth of room rather than a bar: today, the small icon on a pushed payment's notification. `null` falls back to your launcher icon. |

The logo is a **self-theming template SVG**: one asset serves both surfaces. The SDK substitutes the active colour scheme into shared placeholder tokens before rendering, so you never ship separate light/dark variants. The supported tokens are `{{PRIMARY}}`, `{{SECONDARY}}`, `{{ERROR}}`, `{{SURFACE}}`, `{{ONSURFACE}}` and `{{OUTLINE}}`; any token left unreplaced renders as an invisible fill.

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
    logo = HDCompanyLogo(asset = "brand-logo.svg", icon = "brand-icon.svg"),
)

val config = HDConfig(
    // ... other props
    theme = myCustomTheme,
)
```

The theme mode (`HaloThemeMode.LIGHT`, `DARK`, or `SYSTEM`) is set via `HDConfig` and can also be changed at runtime:

```kotlin
import za.co.synthesis.halo.sdk_ui.models.HaloThemeMode

HaloSdkUi.setThemeMode(HaloThemeMode.DARK)
```

#### Text sizes

Every piece of text the SDK draws asks for a *role*, not a font size, and `HDTextSizes` says how big each role is. Change one and every screen that uses it follows; line spacing scales with the size, so larger type never collides.

| Property | Default | Used for |
|----------|---------|----------|
| `display` | `45.sp` | The amount, and nothing else |
| `titleLarge` | `22.sp` | A page's headline ("Payment Approved") |
| `title` | `16.sp` | Section headings and button labels |
| `body` | `14.sp` | Running text |
| `bold` | `16.sp` | Emphasis within running text |
| `label` | `12.sp` | The left side of a detail row |
| `value` | `14.sp` | The right side of a detail row |

The defaults are the Material 3 type scale, so a theme that says nothing about text looks exactly as it always has. Sizes are in **sp** and honour the device's font-size accessibility setting.

```kotlin
import za.co.synthesis.halo.sdk_ui.models.HDTextSizes
import androidx.compose.ui.unit.sp

val theme = HDTheme(
    // A results screen that has to be read across a counter
    text = HDTextSizes(label = 14.sp, value = 16.sp),
)

// Or the one-knob version — the same UI, 15% larger
val bigger = HDTheme(text = HDTextSizes.scaled(1.15f))
```

#### Building a theme without Compose

A host bridging from another runtime (e.g. a Flutter or React Native app embedding the SDK) can construct a theme without importing Compose types. `HDColorScheme.fromArgb(...)` takes plain `0xAARRGGBB` longs, and `HDTheme.build(...)` takes a raw dp float and an asset path:

```kotlin
val theme = HDTheme.build(
    light = HDColorScheme.fromArgb(
        primary = 0xFF6200EE, secondary = 0xFF3700B3, surface = 0xFFFFFFFF,
        onSurface = 0xFF000000, onPrimary = 0xFFFFFFFF, outline = 0xFFCCCCCC,
        error = 0xFFB00020,
    ),
    // dark = HDColorScheme.fromArgb(...) — defaults to the Halo dark scheme
    shapeDp = 12f,
    logo = "brand-logo.svg",
    icon = "brand-icon.svg",
    // Raw sp floats; any size omitted keeps its default
    text = HDTextSizes.fromSp(label = 14f, value = 16f),
)
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

## 💳 Usage

### Launching a Transaction

`HaloSdkUi.launch` is a suspend function that opens the SDK UI and returns when the transaction completes.

| Parameter | Type | Description |
|-----------|------|-------------|
| `amount` | `BigDecimal?` | The transaction amount. If `null` or zero, the SDK shows a keypad for the user to enter the amount. |
| `merchantRef` | `String?` | Optional merchant reference. Supply one and it is used as-is (and shown read-only on the keypad screen); pass `null` and the merchant can type one on the keypad. |
| `currency` | `HDCurrency?` | The transaction currency (`HDCurrency.ZAR`, `GBP`, `EUR`, or `USD`). Defaults to `ZAR` if `null`. |
| `presentation` | `HDPresentation` | Full-screen (the default), or this charge as a sheet over your app — see [Presentation](#presentation). Per charge, so consecutive charges can differ. |

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

### Receipts

On an approved transaction the SDK's result screen offers **Send receipt**. The merchant enters an email address, a mobile number, or both, and the Halo kernel sends the receipt against the transaction's own reference — one request per channel. The screen confirms once it has gone out.

Delivery is the kernel's, not the device's: there is no Android share chooser in the flow, nothing is pasted into a third-party app, and the backend keeps a record that a receipt was issued. An approved charge can always be receipted, so the button never sits disabled waiting on a lookup.

The result screen also shows a **receipt QR code** when the kernel returns one, which the cardholder can scan to take the receipt with them. It may never arrive; the screen shows everything else regardless.

Nothing here needs host wiring — it is part of the SDK's result screens, so it appears whenever `showTransactionResult` is left `true`.

### Dynamic Currency Conversion (DCC)

> **Not yet exposed**: the DCC flow is implemented, but the `showDCC` option is commented out in `HDConfig`, so nothing can currently switch it on. This section describes the flow it will restore.

When enabled, the SDK offers the cardholder a choice of currency after their card is read:

1. A **currency-selection screen** shows the amount in the local currency and in the card's currency, along with the exchange rate and conversion margin.
2. The cardholder picks one and the transaction completes in that currency.
3. The success screen then includes the DCC details: local total, exchange rate, margin, transaction currency, and the total transaction amount in the chosen currency.

### Handling Results

`launch` returns a `HaloTransactionResult?` containing a `resultType`, transaction references, and (for completed transactions) a `receipt`.

By default (`showTransactionResult = true`) the SDK shows its own success/failure screens first, and `launch` returns once the merchant dismisses them. Set `showTransactionResult = false` in `HDConfig` and it returns as soon as the transaction completes, leaving the outcome — and the receipt — to your own UI.

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

## 🏗️ Build configuration {#build-configuration}

Two things have to be settled in your app's **build** rather than in its `init` call, because both live in the manifest — which is read before any of your code runs, so no runtime call could set them.

| Resource | Default | What it does |
|----------|---------|--------------|
| `halo_url_scheme` | `halo` | The custom scheme payment links arrive on — `halo://pay?…` |
| `halo_applink_host` | *(empty)* | Your App Link domain, as an `autoVerify` filter for `http` and `https` |

Both ship as string resources the SDK's payment activity points its filters at. Override them and the filters are yours; ignore them and you get `halo://` plus an App Link filter that matches nothing — exactly as v1 shipped for a brand with no links of its own. Neither is mandatory.

In your app module's `build.gradle.kts`:

```kotlin
android {
    buildFeatures { resValues = true }
    defaultConfig {
        resValue("string", "halo_url_scheme", "yourbrand")
        resValue("string", "halo_applink_host", "pay.yourbrand.com")
    }
}
```

Or declare the same names in `res/values/strings.xml` — app resources win over a library's either way.

**One scheme per brand.** Two apps claiming `halo://` on the same device is a chooser the payer should never see. If you override `halo_url_scheme`, pass the same value as `HDConfig.scheme` so the parser knows which scheme is yours — the resource is the manifest half, `HDConfig.scheme` the runtime half, and they have to agree.

`autoVerify` on the App Link filter needs an `assetlinks.json` published on that domain; without it Android offers a chooser instead.

You still declare **no intent filters**. The domain lands on the SDK's own activity, which keeps every payment on the native path.

## 🔗 Inbound Payment Links {#inbound-payment-links}

A payment can reach the SDK from outside your app — another app launching it, or a customer tapping a link. The SDK's own activity owns those entry points and handles them **natively**: it parks the payment, boots itself from the config your last `init` cached (so the flow carries your branding and language), and runs the transaction. No host code runs, and on a Flutter or React Native host no JavaScript or Dart engine is even started.

Declared out of the box, nothing to add:

| Entry point | Shape |
|-------------|-------|
| App-to-app | action `za.co.synthesis.halo.transaction`, with `transaction_id` and `jwt` extras (and optional `is_tap`) |
| Custom scheme | `<scheme>://pay?amount=&currency=&merchantReference=` — `<scheme>` is `halo_url_scheme` |
| Your App Link domain | `https://<your domain>/…` carrying either the payment query params or a bare reference |

Query parameters accept both v1 spellings: `merchantReference` or `reference`, `transactionId` / `id` / `uuid`, and `configJwt` or `jwt`.

> **Firebase Dynamic Links (`halompos.page.link`) are no longer claimed.** FDL was shut down in August 2025, nothing in the SDK resolves a short link into its payment payload, and a bare `page.link` URL carries no query to read — so the filter only ever offered the app in a chooser for a link it could not act on.

### Short App Links

One link shape needs configuration: an App Link that carries a **reference and no `configJwt`** — the short form the enabler mints, which stands for a payment rather than describing one. Resolving it against the kernel is what *produces* the token, so there is no token to read the kernel's address from, and the host has to say which kernel to ask:

```kotlin
val config = HDConfig(
    // ... other props
    kernel = "kernelserver.go.qa.haloplus.io",
    kernelPins = setOf("sha256/CNOtjib4NAlSqDZDY5aknDcVbcfLEWBgnGl/dgec4aA="),
)
```

`kernelPins` are SHA-256 SPKI fingerprints as `sha256/<base64>` (bare base64 is accepted too) — the same values a token's `aud_fingerprints` claim carries. More than one is normal, so a certificate rotation can't brick the SDK. An empty set resolves the link unpinned, which is logged.

Leave both `null`/empty if your links carry their own JWT: every other call reads its kernel, and its pins, off the credential it presents.

> If a payment link reaches your app's own activity instead, nothing here matched it — check the host and scheme against the table above. Don't route it yourself: the query carries a live `configJwt`, and anything that renders an unmatched URL renders that credential with it.

### DebiCheck mandates

A **DebiCheck mandate** — v1's TT3 — is a debit order the payer authorises by tapping their card, rather than a payment. It arrives through the doors above and needs nothing extra from you: the SDK recognises it, runs the same tap flow, and charges it with the kernel's TT3 call.

| Entry point | How it says it is a mandate | Fields |
|-------------|------------------------------|--------|
| App-to-app | `is_tap` extra set to `false` | `accountNumber`, `pid`, `maxCollectionAmount`, `contractReference`, `collectionDay`, `creditorABSN` |
| URL / App Link | `type=TT3` in the query | the same names, except the payer's identity number is `id` and the transaction is `uuid` |

**The kernel's record wins.** Whatever the intent or link carries, a mandate with a transaction id is always read back from `/consumer/qrCodeDetails/{id}` before it is charged: the account and identity number it is *registered* against are the kernel's, and the charge has to be presented with that record's `paymentJwt` rather than the link's own token.

**What the payer sees.** The tap screen leads with the **instalment amount** — the figure itself is the mandate's max collection amount, the ceiling the debit order may collect up to, which is also what the kernel authorises against and what the PIN pad shows — and, under it, the four things that identify the order: the debit order day, the account it comes off, the creditor's description and the contract reference. A mandate is a document being agreed to rather than a price being paid, so those sit in a card together. Once the card has been read the terms collapse away and the amount stays, since by then they have been agreed to.

`creditorABSN` is the creditor's **Abbreviated Short Name** — the short trading name that appears on the payer's bank statement. It renders as the "Description" row. `collectionDay` is the day of the month the order runs. Both fall back to `undefined` when a caller omits them, as v1 does; `accountNumber` and the identity number are required, and a mandate without them is rejected rather than charged blank.

> The mandate's own success screen replaces the card, scheme and authorisation rows with the order's terms: nothing has been collected yet, so a payment receipt would be describing something that has not happened.

## 📲 Push to Terminal {#push-to-terminal}

A **fourth door**, alongside the three above: a payment sent to a *named device*. A merchant system calls the kernel's `POST /consumer/push` naming one of its registered devices, and that device opens on the tap screen with the amount already on it — no QR to show, nothing for the cardholder to scan.

Like the other three, it is handled entirely by the SDK. The message arrives at the SDK's own `FirebaseMessagingService`, becomes a payment URL, and goes to the same activity a payment link goes to — so a pushed payment is charged by exactly the code that charges the rest.

**There is nothing to add to your manifest.** No service declaration, no provider, no intent filter. The reason matters: a pushed payment can *start the process*, so there may be no Activity and no host code alive when it lands — anything you would have had to contribute could not be relied on to exist. The one thing you bring is your own Firebase project.

### Your Firebase project

Your `google-services.json`, in your app module, read by the Google Services Gradle plugin — exactly as any other Firebase app has it:

```kotlin
// app/build.gradle.kts
plugins {
    id("com.google.gms.google-services")
}
```

Then say you want pushed payments:

```kotlin
val config = HDConfig(
    // ... other props
    receivePush = true,
)
```

That is the whole of it. The plugin turns the file into `google_app_id`, `google_api_key` and `project_id` string resources; Firebase's own `FirebaseInitProvider` — which arrives with the `firebase-messaging` dependency this library already brings, so it is in your merged manifest whether you asked for it or not — reads them at process start, at `initOrder` 100, ahead of any service binding. The SDK never names a project: it uses the app's own, the same one your analytics or crash reporting would use.

A host that would rather not add the plugin can write the same three resources by hand, which is all the plugin does:

| Resource | In `google-services.json` | Why it is needed |
|----------|---------------------------|-------------------|
| `google_app_id` | `client[…].client_info.mobilesdk_app_id` — the entry whose `package_name` is your app's | `FirebaseOptions` will not build without it |
| `google_api_key` | `client[…].api_key[0].current_key` | Same |
| `project_id` | `project_info.project_id` | Firebase Installations, which FCM sits on, will not reach the backend without it |

`gcm_defaultSenderId` (`project_info.project_number`) is not among them: Firebase derives the sender id from the app id, which is `1:<senderId>:android:<hash>`. None of it is secret either — every one of these ships in the clear inside any APK built the ordinary way.

Leave `receivePush` false and nothing changes: no token is ever issued, `POST /devices` is never called, the device is never pushed at, and the app is exactly itself minus the ability to receive. A build with no Firebase project at all reaches the same place with the flag set — there is simply no token to register.


### Registering the device — nothing to do

The kernel pushes at a device it holds a Firebase token for, so it has to be told. **The SDK tells it**, as part of `init`, off the critical path.

It is the SDK's call rather than yours because it is keyed on two things only the SDK holds: the **device installation id**, minted inside its own device registration, and the **Firebase token**, minted against the project it stands up. Handing both out for a host to relay would mean every integrator writing the same `POST /devices`.

What that buys you: a device becomes pushable by being brought up. There is nothing to call, and nothing to remember.

- **The merchant's name for a terminal survives.** `POST /devices` is an upsert with a required `friendlyName`, so the SDK reads the estate first and keeps this device's existing name; only a device nobody has named yet gets the hardware's own ("Samsung SM-G991B").
- **A rotated token re-registers itself** — immediately when there is a session to do it under, and otherwise at the next `init`, since the recorded token no longer matches.
- **The common path costs no network.** A registration that would restate what the kernel already holds is skipped.
- **A failure is never yours to handle.** It is logged; the device still takes payments the ordinary way, and the next bring-up tries again.

If you show the merchant their estate, `GET /devices` is your call to make — and `HaloSdkUi.deviceInstallationId(context)` is what picks out the row for the device in their hand.

**One case the SDK cannot see: you delete this device's own row.** `DELETE /devices/{id}` on the kernel leaves the SDK still holding the token it last registered with — which is exactly what the "common path costs no network" check above compares against, so it keeps skipping `POST /devices` forever. Tell it:

```kotlin
HaloSdkUi.forgetTerminalRegistration(context)
```

Nothing registers on the spot — the next merchant token the SDK is handed does, the same path every other registration takes. Call it right after a successful delete of *this device's* row; deleting another terminal's row needs nothing from you.

### What the merchant sees

With the app **open**, the payment opens straight away — no tap. Backgrounded, a notification is posted and the payment opens when it is tapped; Android does not let a backgrounded app start an Activity, and a high-priority Firebase message does not change that. The notification's copy comes from the SDK's own `assets/lang/<code>.json` in the language you configured, and it is tinted with your primary colour.

Android draws a small icon as a **silhouette off its alpha channel** — only the mark's shape survives, and a mark with no transparent margin fills the badge and reads as a blob however clean its alpha is. So the SDK looks for a drawable **your own build already generates**, before it renders anything itself:

1. `ic_notification`, if your app declares one — the escape hatch for a host that wants to draw its own.
2. `ic_launcher_foreground` — the foreground layer of your adaptive launcher icon: your mark on a transparent canvas, already inset to the padding an adaptive icon needs. If your build generates one (as `halo_verse`'s does, per brand), this is what a pushed payment's notification uses, with no extra artwork.
3. `HDCompanyLogo.icon`, rendered from your SVG on the spot — for a host with neither of the above.
4. Your launcher icon (`applicationInfo.icon`) — last, and only better than nothing: a launcher icon is opaque edge to edge by definition, so silhouetted it is a solid block. This is what you saw if a build reached here.

Looked up by resource name, since a library cannot reference your `R` — nothing to wire if you already generate `ic_launcher_foreground`.

One loose end is caught on a hook you already call: a message carrying a `notification` block is drawn by the system, and its tap opens **your** launcher activity rather than the SDK's — so `HaloSdkUi.attach` checks the intent it is handed for a pushed payment. Nothing to wire, as long as `attach` is the first line of your `onCreate`.

:::caution
The shape of the Firebase message the kernel sends is not part of Halo's published Push to Terminal contract, which stops at the `POST /consumer/push` response. The SDK accepts either plausible shape — a payload carrying the payment link outright (`url` / `link` / `applink` / …), or one naming the payment field by field (`transactionId` / `reference`, `amount`, `currency`, `merchantReference`, `configJwt`) — and logs the keys of anything it cannot read. Watch it with `adb logcat -s HaloPush`.
:::

## 📊 Example Application

See the [example app](https://github.com/halo-dot/halo_sdk_ui/tree/main/example-app) for a complete working integration.

## 📄 License

Copyright © 2026 Halo Dot. All rights reserved.

Use of this SDK is subject to the Halo Terms of Service.

## 📞 Support

- **Documentation**: [Halo Developer Portal](https://docs.halodot.io/docs/category/intents)

---

*Made with ❤️ by the Halo Team*
