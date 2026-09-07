---
sidebar_class_name: hidden
---

# Halo UI SDK for Android

[![Platform](https://img.shields.io/badge/platform-Android-green.svg)](https://developer.android.com)
[![Min SDK](https://img.shields.io/badge/minSDK-29-blue.svg)](https://android-arsenal.com/api?level=29)
[![Compose](https://img.shields.io/badge/UI-Jetpack%20Compose-orange.svg)](https://developer.android.com/jetpack/compose)
[![Version](https://img.shields.io/badge/version-0.0.22-blue.svg)](#3-add-the-dependency)

Add a dependency, make four calls, and your app can take a card payment. The SDK owns everything in between: amount entry, the card-reading screens, the PIN pad, the result screen and the receipt. It is built with Jetpack Compose and designed to be driven from a Flutter or React Native host just as easily as from Kotlin.

**Contents**

[Installation](#installation) · [Quick start](#quick-start) · [HDConfig](#hdconfig) · [Taking a payment](#taking-a-payment) · [Presentation](#presentation) · [Theming](#theming) · [Languages](#languages) · [Permissions](#permissions) · [Build configuration](#build-configuration) · [Inbound payments](#inbound-payments) · [Push to Terminal](#push-to-terminal) · [Telemetry](#telemetry)

## What you get

- **The whole payment UI.** Amount entry, card-reading animation, PIN, success and failure screens.
- **Your branding.** Light and dark colour schemes, corner radius, type sizes and your own logo, stated once as a file in your build.
- **Digital receipts.** The Halo kernel emails or texts the cardholder's receipt against the transaction's own reference.
- **Payments that arrive from outside.** App-to-app intents, payment links and pushed payments are handled natively by the SDK, with no host code involved.
- **DebiCheck mandates.** A TT3 debit-order mandate arrives through the same doors and runs the same tap flow.
- **Seven languages**, following the device by default, and every string overridable per brand.
- **Cross-runtime friendly.** A brand stated as a file and a suspending token callback, so a Flutter or React Native host bridges four values, not a config object.
- **Optional telemetry.** Off by default. Switched on, the SDK reports its own operations and crashes into *your* Firebase project and never anything about the payment.

> Dynamic Currency Conversion is implemented but not yet switchable: `showDCC` is commented out in `HDConfig` while the flow is reworked. See [DCC](#dynamic-currency-conversion).

## Requirements

- Android 10 (API 29) or higher
- A Halo SDK token, issued by Synthesis/Halo
- A `ComponentActivity` (or a subclass such as `AppCompatActivity`) to host the SDK

## Installation

<p align="center">
  <img alt="Integrating the Halo UI SDK: build setup, manifest resources, and the four calls in your code." src="/img/halo-sdk-ui/integration-map-light.svg" style={{ width: "100%" }} />
</p>

### 1. Add your credentials

Registering on the developer portal gets you an AWS access key and secret. They are sensitive, so keep them out of source control. Put them in `local.properties`:

```properties
aws.accesskey=< PROVIDED IN EMAIL >
aws.secretkey=< PROVIDED IN EMAIL >
```

### 2. Add the repository

In `settings.gradle.kts`:

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

### 3. Add the dependency

```kotlin
dependencies {
    implementation("za.co.synthesis.halo:sdk_ui:0.0.22")
}
```

One coordinate covers both variants. Gradle picks the debug SDK for your debug build and the production SDK for your release build from the module metadata, so you declare nothing variant-specific.

## Quick start

```kotlin
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import za.co.synthesis.halo.sdk_ui.HaloSdkUi
import za.co.synthesis.halo.sdk_ui.models.HDConfig

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 1. First line. Loads the payment kernel. Needs nothing from you.
        HaloSdkUi.attach(this, savedInstanceState)

        val config = HDConfig(
            activity = this,
            onTokenRequest = {
                // Return your Halo SDK token. This is a suspend context, so a
                // network call to your backend needs no extra plumbing.
                "YOUR_SDK_TOKEN"
            },
        )

        // 2. At your splash. Loads your brand file and warms the artwork.
        //    Returns immediately.
        HaloSdkUi.prepare(config)

        // 3. As soon as you have a session token, usually right after login.
        lifecycleScope.launch {
            val result = HaloSdkUi.init(config)
            Log.d("Halo", "SDK init: ${result?.resultType} (${result?.errorCode})")
        }
    }
}
```

Then, per charge:

```kotlin
val result = HaloSdkUi.launch(amount, merchantRef, currency)
```

That is all the code. The other half of an integration is one file, `src/main/assets/halo/brand.json`, which is what makes those screens yours rather than Halo's:

```json
{
  "light": { "primary": "#FF6200EE" },
  "logo": "brand-logo.svg"
}
```

Every key is optional and there is nothing to call — see [Theming](#theming).

<p align="center">
  <img alt="Bring-up: attach at onCreate, prepare at your splash, init once you hold a token, launch per charge." src="/img/halo-sdk-ui/bring-up-light.svg" style={{ width: "100%" }} />
</p>

### The four calls

| Call | Where | Blocking? | What it does |
|------|-------|-----------|--------------|
| `attach(activity, savedInstanceState)` | First line of `onCreate` | No | Loads the payment kernel, overlay protection and entropy, and wires the Android lifecycle through. |
| `prepare(config)` | Your splash screen | No | Reads your brand file, loads its language, and warms the tap screen's artwork. |
| `init(config)` | As soon as you hold a session token | Suspends | Registers the device, requests runtime permissions and brings the SDK up. Returns the real outcome. |
| `launch(amount, ref, currency, presentation)` | Per charge | Suspends | Runs the transaction and returns the result. |

**The order is the point.** Each call needs strictly more than the one before it — an Activity, then your config, then a token — so each runs the moment that thing exists and the work spreads across your startup instead of piling up in front of a merchant holding a card. Skipping any of the first three is legal and costs only speed, because the next call does that work too.

Two that are worth more than a table row:

- **`attach` is the expensive one**, and it must be the first line of `onCreate` — not your splash, not after your own setup. Everything your app does afterwards then runs against a payment stack that is already loading. Pass `savedInstanceState` straight through so the SDK can restore itself across a process death. Cheap to call more than once, and you never forward `onStart` / `onResume` / `onPause` / `onStop` yourself. The SDK logs a warning if it ran late.
- **`init` waits for the truth.** It suspends until the SDK reports its real outcome — registered, attested, initialised, kernel settled — and returns a `HaloInitializationResult?`, whose `resultType` and `errorCode` say why when it failed; `null` means setup broke before the SDK could report at all. So you never discover a dead SDK mid-transaction and there is nothing to poll. Idempotent, so calling it again later as a backstop costs nothing.

### Two extra properties

```kotlin
val version = HaloSdkUi.sdkVersion                          // readable before attach()
val installation = HaloSdkUi.deviceInstallationId(context)  // null until first registration
```

`sdkVersion` is the underlying Halo SDK's own version string, for a host that displays it beside a link to the PCI listing. `deviceInstallationId` is what the kernel knows this install by, and what you present to register the device for Push to Terminal. It is `null` until `init` has registered the device once, and survives launches and process deaths after that.

## HDConfig

Two fields, and both are required.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `activity` | `ComponentActivity` | required | The activity hosting the SDK UI. Must be a `ComponentActivity`, since the UI is Compose. |
| `onTokenRequest` | `suspend () -> String` | required | Returns a valid Halo SDK token. A suspend context, so fetching it from your backend needs no extra plumbing. A plain lambda still fits; Kotlin converts it. |

**Everything else is your [brand file](#theming)** — colours, type, the marks, the language, the scheme logos, the link scheme, the kernel your short App Links resolve against, how an inbound payment is presented, and every switch the SDK offers. There are no runtime setters either. [Why](#why-it-is-a-file-not-a-config), in one line: an inbound payment runs none of your code, so anything only a call could say is a thing that flow cannot know.

What is left is what a file genuinely cannot state: `activity` and `onTokenRequest` exist only while you are running.

Your app's package name and version are read from the platform, so you do not supply them.

## Taking a payment

`HaloSdkUi.launch` is a suspend function. It opens the SDK UI and returns when the transaction is done.

| Parameter | Type | Description |
|-----------|------|-------------|
| `amount` | `BigDecimal?` | The amount. `null` or zero shows a keypad for the merchant to enter one. |
| `merchantRef` | `String?` | Optional reference. Supply one and it is used as-is and shown read-only on the keypad; pass `null` and the merchant can type one. |
| `currency` | `HDCurrency?` | `ZAR`, `GBP`, `EUR` or `USD`. Defaults to `ZAR`. |
| `presentation` | `HDPresentation` | Full-screen (the default) or a sheet over your app, per charge. See [Presentation](#presentation). |

<p align="center">
  <img alt="A charge from launch() through the keypad, tap, PIN and result screen to HaloTransactionResult." src="/img/halo-sdk-ui/transaction-flow-light.svg" style={{ width: "100%" }} />
</p>

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

Pass an amount and the SDK skips the keypad and goes straight to the tap screen. Pass `null` and the merchant enters the amount, and optionally a reference, first.

### Handling results

`launch` returns a `HaloTransactionResult?` carrying a `resultType`, the transaction references and, for a completed transaction, the receipt.

| Type | Meaning |
|------|---------|
| `Approved` | The transaction succeeded |
| `Declined` | The bank or issuer declined it |
| `Cancelled` | The user closed the SDK before completion |
| `CardTapTimeOutExpired` | The card was not tapped in time |
| `NetworkError` / `ProcessingError` | A technical failure |

```kotlin
import za.co.synthesis.halo.haloCommonInterface.HaloTransactionResult
import za.co.synthesis.halo.haloCommonInterface.HaloTransactionResultType

fun handleResult(result: HaloTransactionResult?) {
    when (result?.resultType) {
        HaloTransactionResultType.Approved ->
            println("Approved: ${result.merchantTransactionReference}")
        HaloTransactionResultType.Declined -> println("Declined")
        HaloTransactionResultType.Cancelled -> println("Cancelled by user")
        else -> println("Transaction status: ${result?.resultType}")
    }
}
```

By default the SDK shows its own success and failure screens first, and `launch` returns once the merchant dismisses them. Set `"showTransactionResult": false` in your [brand file](#theming) and it returns the moment the transaction completes, leaving the outcome and the receipt to your own UI.

### When something goes wrong

A technical failure, as opposed to a decline, ends on the SDK's error screen. It shows a plain sentence saying what happened, and under it an **Error details** line carrying the SDK's own names for the failure.

Those codes are the part worth quoting to support. The payment SDK routinely names one failure twice, once as an error code and once as a result type, and the useful half is not always the same one: a refused charge answers `GeneralError` plus `UnknownError`, while a denied camera answers `CameraPermissionNotGranted` with no error code at all. The screen leads with whichever name says something and lists all of them underneath, and when a name says a permission is missing it also offers a route to your app's settings page.

Failures that already carry a sentence for the payer, such as an unusable QR code, show that sentence alone with no codes under it.

### Receipts

On an approved transaction the result screen offers **Send receipt**. The merchant enters an email address, a mobile number or both, and the Halo kernel sends the receipt against the transaction's own reference, one request per channel. The screen confirms once it has gone.

Delivery is the kernel's, not the device's: there is no Android share chooser, nothing is pasted into a third-party app, and the backend keeps a record that a receipt was issued. The screen also shows a **receipt QR code** when the kernel returns one, which the cardholder can scan to take the receipt with them. It may never arrive, and the screen shows everything else regardless.

None of this needs host wiring. Set `"shareReceipt": false` in your [brand file](#theming) to remove all of it: the Share button, the sheet behind it and the QR. The `receipt/pdf` lookup is then never made either, since nothing is fetched for a screen that would not show it. On a decline the primary button is Retry, so a decline keeps its retry either way. It is in the file with the rest of your brand, so an inbound payment behaves the same way.

### Dynamic Currency Conversion

> **Not yet exposed.** The flow is implemented, but `showDCC` is commented out in `HDConfig`, so nothing can switch it on today. This describes what it will restore.

After the card is read, the cardholder is shown the amount in the local currency and in the card's currency, with the exchange rate and conversion margin. They pick one, the transaction completes in that currency, and the success screen carries the DCC details.

## Presentation

`HDPresentation.FULL_SCREEN` (the default) is the SDK as its own app: an opaque activity that replaces yours for the length of a charge.

`HDPresentation.SHEET` presents the charge as a bottom sheet with your app dimmed behind it, so it reads as *your app asking for a card* rather than another app taking over.

```kotlin
HaloSdkUi.launch(amount, merchantRef, currency, presentation = HDPresentation.SHEET)
```

Nothing goes in your manifest. `launch` takes its own `presentation`, so consecutive charges can differ, and your brand file's `presentation` answers for the flows that arrive with no `launch` call at all, such as an intent or a payment link.

**A sheet is the same screen, smaller.** Same parts, same order, same type hierarchy, laid out for a shorter surface rather than redrawn for it — every page declares a heading, a body and an optional footer, and one shell arranges them, so portrait, landscape and sheet all fall out of the same declaration. The whole charge lives in one sheet with pages changing inside it, so bring-up handing over to tap is not one surface closing and another opening. The keypad and the detailed breakdown stay full-screen either way.

Two things are the sheet's own. It carries a **top bar**: your logo on the left (leading rather than centred, so it does not shift as the actions change width) and, on the right, the buttons a full-screen page puts at its foot (Cancel, Share receipt, Charge). And "Powered by Halo Dot" sits at its foot, because inside your app the payment surface has to say whose it is.

Swiping the sheet down, tapping the dimmed area and pressing back all raise a cancel confirmation, on the bring-up screen as well as on tap. The sheet never simply closes, because an accidental swipe would otherwise abort a live card read.

**Know what a sheet costs.** A window's surface format is fixed at creation, so the SDK's activity is created translucent and converts itself to opaque for a full-screen charge (`Activity.setTranslucent`, API 30+). Full-screen brands are therefore unaffected. Under a sheet your app is no longer *stopped* behind the payment surface: it keeps rendering next to a live card read, and another app's pixels are visible behind a card-present screen, which is the shape overlay protection exists to catch (`HaloErrorCode.OverlayDetected`).

A host that starts `HDActivity` itself, handing over a link it scanned rather than one the OS routed to it, can say which presentation to use for that flow:

```kotlin
startActivity(
    Intent(this, HDActivity::class.java)
        .setData(Uri.parse(scannedLink))
        .putExtra(HDActivity.EXTRA_PRESENTATION, HDPresentation.FULL_SCREEN.name)
)
```

The extra outranks the brand file's `presentation` for that one flow, and leaving it out changes nothing. It exists because a link the OS delivered arrived from outside, where a sheet over the host is right, while a link the host *scanned* is the merchant charging from their own screen, where a sheet would float the charge over the viewfinder that just read it.

## Theming

**Your brand is a file.** State it once in your build, as `src/main/assets/halo/brand.json`, and the SDK reads it on every bring-up:

```json
{
  "light": {
    "primary": "#FF6200EE",
    "secondary": "#FF3700B3",
    "surface": "#FFFFFFFF",
    "onSurface": "#FF000000",
    "onPrimary": "#FFFFFFFF",
    "outline": "#FFCCCCCC",
    "error": "#FFB00020"
  },
  "dark": { "primary": "#FFBB86FC", "surface": "#FF121212", "onSurface": "#FFFFFFFF" },
  "shape": 12,
  "logo": "brand-logo.svg",
  "icon": "brand-icon.svg",
  "schemeLogos": { "amex": false, "discover": false },
  "text": { "label": 14, "value": 16 },
  "scheme": "yourscheme",
  "presentation": "SHEET",
  "shareReceipt": false
}
```

There is no call to make and nothing to pass at `init`. Every key is optional, and what you leave out is Halo's own. The bottom rows are behaviour rather than paint, and they are in the same file for the same reason: a brand that hands out no receipts, or takes its payments as a sheet, is that brand on every flow — including the ones that start with none of your code running.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `light` | object | Halo's light scheme | Light-mode colours |
| `dark` | object | Halo's dark scheme | Dark-mode colours |
| `shape` | number | `16` | Corner radius, in dp, for buttons and containers |
| `logo` | string | the Halo logo | Your logo, serving both light and dark modes |
| `icon` | string | your launcher icon | Your **square app mark**, used where the SDK has one glyph's worth of room. Today that is the small icon on a pushed payment's notification |
| `text` | object | the Material 3 scale | Type sizes in sp. See [Text sizes](#text-sizes) |
| `schemeLogos` | object | all on | Which card scheme logos are shown: `nfc`, `visa`, `mastercard`, `amex`, `discover`, `elo`, each a boolean |
| `themeMode` | string | `"SYSTEM"` | `"LIGHT"`, `"DARK"` or follow the device |
| `language` | string | the device's | `"en"`, `"af"`, `"zu"`, `"fr"`, `"de"`, `"es"`, `"pt"`. See [Languages](#languages) |
| `presentation` | string | `"FULL_SCREEN"` | `"SHEET"` puts inbound payments over the app that sent them. See [Presentation](#presentation) |
| `scheme` | string | `"halo"` | The custom scheme your payment links arrive on. Must match the `halo_url_scheme` resource |
| `kernel` | string | none | The kernel that short App Links resolve against. See [Short App Links](#short-app-links) |
| `kernelPins` | string | none | SHA-256 SPKI fingerprints for `kernel`'s TLS certificate, semicolon- or comma-separated |
| `showTransactionResult` | boolean | `true` | Whether the SDK shows its own result screens |
| `shareReceipt` | boolean | `true` | Whether the result screen offers **Share receipt**. See [Receipts](#receipts) |
| `receivePush` | boolean | `false` | Whether this device registers to receive pushed payments. See [Push to Terminal](#push-to-terminal) |
| `analytics` / `crashReports` | boolean | `false` | What the SDK reports about itself. See [Telemetry](#telemetry) |

A colour is `#AARRGGBB`, `0xAARRGGBB`, a bare `RRGGBB` (opaque) or a packed integer, so the same hex your `colors.xml` and your designer use goes straight in. The colours themselves are `primary`, `secondary`, `surface`, `onSurface`, `onPrimary`, `outline` and `error`; name only the ones you are changing.

The logo is a **self-theming template SVG**, so one asset serves both surfaces. The SDK substitutes the active colour scheme into placeholder tokens before rendering: `{{PRIMARY}}`, `{{SECONDARY}}`, `{{ERROR}}`, `{{SURFACE}}`, `{{ONSURFACE}}` and `{{OUTLINE}}`. Any token left unreplaced renders as an invisible fill. Both paths are asset paths in your own APK, so a Flutter host names its bundled mark `flutter_assets/assets/brand/logo.svg`.

### Why it is a file, not a config

All of this used to be parameters on [`HDConfig`](#hdconfig), and being parameters made them a lie. An [inbound payment](#inbound-payments) brings the SDK up cold, natively, in a process where no host code has run and nothing has called `init`, so an app whose brand existed only in a call had no brand at all on the flow a cardholder was most likely to see. What the SDK had was the last config it had been given, which is nothing on an install that was never opened or has had its data cleared — and those payments came up in Halo's own colours on a merchant's phone.

A file is in the APK before the app has run once, and on the launch nobody made. So the brand is stated where it cannot go missing, and two places answer for the SDK: **the file** for what this app is and where it talks, and **[`HDConfig`](#hdconfig)** for the live wiring, which is the one thing a file cannot hold.

Your own app can still have a theme switch or a language picker. It moves your app, not the payment screens: those are the file's, so what a cardholder sees is the same whether the charge started on your keypad or arrived as a link at four in the morning.

### Text sizes

Every piece of text asks for a *role*, not a size, and the `text` object says how big each role is, in sp. Change one and every screen using it follows. Line spacing scales with the size, so larger type never collides.

| Key | Default | Used for |
|----------|---------|----------|
| `display` | `45` | The amount, and nothing else |
| `titleLarge` | `22` | A page's headline ("Payment Approved") |
| `title` | `16` | Section headings and button labels |
| `body` | `14` | Running text |
| `bold` | `16` | Emphasis within running text |
| `label` | `12` | The left side of a detail row |
| `value` | `14` | The right side of a detail row |

The defaults are the Material 3 type scale, so a brand that says nothing about text looks exactly as it always has. Sizes honour the device's font-size accessibility setting.

```json
{ "text": { "label": 14, "value": 16 } }
```

## Languages

The SDK ships English (`en`), Afrikaans (`af`), Zulu (`zu`), French (`fr`), German (`de`), Spanish (`es`) and Portuguese (`pt`). It follows the device language by default and falls back to English for anything else. Pin one in your [brand file](#theming):

```json
{ "language": "af" }
```

Say nothing and the SDK follows the device, which is what a merchant's phone already reflects.

### Saying it your way

Any string the SDK shows can be reworded per app. Ship a **partial** catalogue in your own assets at `assets/lang/overrides/<code>.json`, containing only the keys you say differently:

```json
{
  "tap_and_hold": "Hold the card against the back of the phone.",
  "payment_approved": "Paid"
}
```

That is the whole of it. There is no call to make. The file is laid over the SDK's catalogue whenever a language loads, so everything you do not name stays as translated, and a string added in a later SDK release is live the day you take it.

An asset rather than a call, for [the reason your appearance is one](#why-it-is-a-file-not-a-config): it is in the APK before your app has run, so a payment that arrives first is worded the way you meant.

One thing to know: a key this SDK does not have replaces nothing. It cannot fail your build, so it is logged instead. `HDLang` warns with the file and the keys it could not place the first time that language loads.

## Permissions

The SDK's permissions merge into your manifest automatically, and the runtime ones are requested for you inside `init()`. You prompt for nothing yourself. The prompt runs *alongside* bring-up rather than in front of it, so a merchant answering it is not also holding up registration. A denial does not abort bring-up: `init` continues, logs what was refused, and the consequences come back in its result.

| Permission | Runtime prompt | Purpose |
|------------|----------------|---------|
| `INTERNET` | | Talking to the Halo backend |
| `NFC` | | Reading payment cards |
| `VIBRATE` / `MODIFY_AUDIO_SETTINGS` | | Feedback on card tap |
| `BLUETOOTH` / `BLUETOOTH_ADMIN` | | External card reader support (pre-Android 12) |
| `CAMERA` | ✓ | Device security verification |
| `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION` | ✓ | Payment compliance |
| `READ_PHONE_STATE` | | Declared by the payment SDK, never prompted for |
| `BLUETOOTH_SCAN` / `BLUETOOTH_CONNECT` | | External card reader support, never prompted for |
| `POST_NOTIFICATIONS` | ✓ (Android 13+, if `receivePush`) | Push to Terminal's notification |

**Declaring is free, prompting is not**, so the two columns are deliberately different. `READ_PHONE_STATE` cannot do what it is named for on any supported device, since Android 10 stopped returning IMEI or serial to a normal app, and asking would cost every merchant a Phone-group prompt that reads as a payment app asking to make calls. Bluetooth is for an external card reader, and there is no reader path in this SDK.

`POST_NOTIFICATIONS` is asked for on Android 13+ only when [`receivePush`](#push-to-terminal) is set, since a build that cannot be pushed to has nothing to notify anyone about. Refused, a pushed payment waits for the merchant to next open the app rather than failing.

### Using the camera in your own app

The kernel watches the camera while it is up. It reads entropy off it and treats another component opening it as tampering, which cancels a card read in progress. If your app uses the camera too, a QR scanner for instance, say so:

```kotlin
HaloSDK.requestCameraUsage()   // before the camera is opened
HaloSDK.returnCameraUsage()    // once it is closed
```

"Closed" is later than it looks. `stop()` on a CameraX controller returns when the release *begins*, and closing the graph and then the device runs about two seconds on the hardware we have measured. Hand the camera back before that and the kernel finds it still open and reports your own scanner as tampering. The SDK holds itself to the same rule: monitoring stands down for the length of a boot, where there is no card read to protect, and comes back up with the tap flow.

The SDK also declares a theme for the payment SDK's PIN pad activity (`PinScreenLauncherActivity`) on your behalf. Without it, a host whose application theme is not AppCompat, such as a Flutter host, crashes the moment the kernel asks for a PIN, with the card already read. You need to do nothing; it is mentioned only so the extra `<activity>` in your merged manifest is not a mystery.

## Build configuration

Two things live in the manifest, which is read before any of your code runs, so no runtime call could set them.

| Resource | Default | What it does |
|----------|---------|--------------|
| `halo_url_scheme` | `halo` | The custom scheme payment links arrive on: `halo://pay?…` |
| `halo_applink_host` | *(empty)* | Your App Link domain, as an `autoVerify` filter for `http` and `https` |

```kotlin
android {
    buildFeatures { resValues = true }
    defaultConfig {
        resValue("string", "halo_url_scheme", "yourbrand")
        resValue("string", "halo_applink_host", "pay.yourbrand.com")
    }
}
```

Declaring the same names in `res/values/strings.xml` works too, since app resources beat a library's either way. Neither is mandatory: ignore them and you get `halo://` plus an App Link filter that matches nothing.

**One scheme per brand.** Two apps claiming `halo://` on the same device is a chooser the payer should never see. If you override `halo_url_scheme`, put the same value in your brand file's `scheme`. The resource is the manifest half and the file's is the parser's half, and they have to agree.

`autoVerify` needs an `assetlinks.json` published on that domain, or Android offers a chooser instead. You still declare **no intent filters**: the domain lands on the SDK's own activity, which keeps every payment on the native path.

## Inbound payments

A payment can reach the SDK from outside your app: another app launching it, a customer tapping a link, or the kernel pushing at the device. The SDK's own activity owns those entry points and handles them **natively** — it parks the payment, boots itself from your [brand file](#theming) and runs the transaction. No host code runs, and on a Flutter or React Native host no Dart or JavaScript engine is even started.

<p align="center">
  <img alt="Four inbound doors, app-to-app, custom scheme, App Link and Push to Terminal, into HDActivity and the same tap flow." src="/img/halo-sdk-ui/inbound-payments-light.svg" style={{ width: "100%" }} />
</p>

Declared out of the box, nothing to add:

| Entry point | Shape |
|-------------|-------|
| App-to-app | action `za.co.synthesis.halo.transaction`, with `transaction_id` and `jwt` extras (and optional `is_tap`) |
| Custom scheme | `<scheme>://pay?amount=&currency=&merchantReference=`, where `<scheme>` is `halo_url_scheme` |
| App Link | `https://<your domain>/…`, carrying either the payment query params or a bare reference |
| Push to Terminal | A message to a named device. See [Push to Terminal](#push-to-terminal) |

Query parameters accept both v1 spellings: `merchantReference` or `reference`, `transactionId` / `id` / `uuid`, and `configJwt` or `jwt`.

> **Firebase Dynamic Links (`halompos.page.link`) are no longer claimed.** FDL shut down in August 2025, nothing in the SDK resolves a short link into its payment payload, and a bare `page.link` URL carries no query to read.

> If a payment link reaches your own activity instead, nothing here matched it. Check the host and scheme against the table above, and do not route it yourself: the query carries a live `configJwt`, and anything that renders an unmatched URL renders that credential with it.

### Short App Links

One link shape needs configuration: an App Link carrying a **reference and no `configJwt`**, the short form the enabler mints. Resolving it against the kernel is what *produces* the token, so there is no token to read the kernel's address from, and your [brand file](#theming) has to say which kernel to ask:

```json
{
  "kernel": "kernelserver.go.qa.haloplus.io",
  "kernelPins": "sha256/CNOtjib4NAlSqDZDY5aknDcVbcfLEWBgnGl/dgec4aA="
}
```

`kernel` is the address this client calls: `https://` is optional and a trailing slash is trimmed, and a path prefix is kept, so a deployment served under one (`qa.example.co.za/kernelserver`) states it. `kernelPins` are SHA-256 SPKI fingerprints as `sha256/<base64>`, the same values a token's `aud_fingerprints` claim carries; bare base64 is accepted too, and several are separated by `;` or `,`. More than one is normal, so a certificate rotation cannot brick the SDK, and naming none resolves the link unpinned, which is logged.

In the file rather than in a call for the sharpest version of the reason the rest of the brand is: this resolve runs *before* the SDK is up, on a start no code of yours took part in — and on an install whose host code may never have run once, since a merchant can be sent a link before they ever open your app.

Leave both out if your links carry their own JWT. Every other call reads its kernel, and its pins, off the credential it presents.

### DebiCheck mandates

A **DebiCheck mandate**, v1's TT3, is a debit order the payer authorises by tapping their card rather than a payment. It arrives through the doors above and needs nothing extra from you: the SDK recognises it, runs the same tap flow, and charges it with the kernel's TT3 call.

| Entry point | How it says it is a mandate | Fields |
|-------------|------------------------------|--------|
| App-to-app | `is_tap` extra set to `false` | `accountNumber`, `pid`, `maxCollectionAmount`, `contractReference`, `collectionDay`, `creditorABSN` |
| URL / App Link | `type=TT3` in the query | the same names, except the identity number is `id` and the transaction is `uuid` |

**The kernel's record wins.** Whatever the intent or link carries, a mandate with a transaction id is read back from `/consumer/qrCodeDetails/{id}` before it is charged. The account and identity number it is *registered* against are the kernel's, and the charge is presented with that record's `paymentJwt` rather than the link's own token.

**What the payer sees.** The tap screen leads with the **instalment amount**, which is the mandate's max collection amount: the ceiling the debit order may collect up to, what the kernel authorises against, and what the PIN pad shows. Under it sit the four things that identify the order: the collection day, the account, the creditor's description and the contract reference. A mandate is a document being agreed to rather than a price being paid, so those sit in a card together, and once the card has been read the terms collapse away and the amount stays.

`creditorABSN` is the creditor's Abbreviated Short Name, the trading name that appears on the payer's bank statement, and it renders as the "Description" row. `collectionDay` is the day of the month the order runs. Both fall back to `undefined` when omitted, as v1 does. `accountNumber` and the identity number are required, and a mandate without them is rejected rather than charged blank.

The mandate's success screen replaces the card, scheme and authorisation rows with the order's terms, since nothing has been collected yet.

## Push to Terminal

A payment sent to a *named device*. A merchant system calls the kernel's `POST /consumer/push` naming one of its registered devices, and that device opens on the tap screen with the amount already on it. There is no QR to show and nothing for the cardholder to scan.

Like the other doors, this is handled entirely by the SDK. The message arrives at the SDK's own `FirebaseMessagingService`, becomes a payment URL, and goes to the same activity a payment link goes to, so a pushed payment is charged by exactly the code that charges everything else.

<p align="center">
  <img alt="Push to Terminal: how a device becomes pushable inside init(), and what happens when a push arrives." src="/img/halo-sdk-ui/push-to-terminal-light.svg" style={{ width: "100%" }} />
</p>

**Nothing goes in your manifest**: no service declaration, no provider, no intent filter. A pushed payment can *start the process*, so there may be no Activity and no host code alive when it lands, and anything you contributed could not be relied on to exist. The one thing you bring is your own Firebase project.

### Your Firebase project

Your `google-services.json` in your app module, read by the Google Services plugin, exactly as any other Firebase app has it:

```kotlin
// app/build.gradle.kts
plugins { id("com.google.gms.google-services") }
```

Then ask for pushed payments in your [brand file](#theming):

```json
{ "receivePush": true }
```

That is the whole of it. The plugin turns the file into three string resources, and Firebase's own `FirebaseInitProvider`, which arrives with the `firebase-messaging` dependency this library already brings, reads them at process start. The SDK never names a project: it uses your app's own.

A host that would rather not add the plugin can write those three resources by hand, which is all the plugin does:

| Resource | In `google-services.json` | Why it is needed |
|----------|---------------------------|------------------|
| `google_app_id` | `client[…].client_info.mobilesdk_app_id`, for the entry whose `package_name` is yours | `FirebaseOptions` will not build without it |
| `google_api_key` | `client[…].api_key[0].current_key` | Same |
| `project_id` | `project_info.project_id` | Firebase Installations, which FCM sits on, will not reach the backend without it |

`gcm_defaultSenderId` is not among them, since Firebase derives the sender id from the app id. None of these is secret either: they all ship in the clear inside any APK built the ordinary way.

Leave `receivePush` false and nothing changes. No token is issued, `POST /devices` is never called, and the device is never pushed at. A build with no Firebase project reaches the same place with the flag set, since there is simply no token to register.

### Registering the device

Nothing to do. The kernel pushes at a device it holds a Firebase token for, so it has to be told, and **the SDK tells it** as part of `init`, off the critical path. It is the SDK's call rather than yours because it is keyed on two things only the SDK holds: the device installation id, minted inside its own registration, and the Firebase token, minted against the project your app stands up.

- **The merchant's name for a terminal survives.** `POST /devices` is an upsert with a required `friendlyName`, so the SDK reads the estate first and keeps this device's existing name. Only a device nobody has named yet gets the hardware's own ("Samsung SM-G991B").
- **A rotated token re-registers itself**, immediately when there is a session to do it under, and otherwise at the next `init`.
- **The common path costs no network.** A registration that would restate what the kernel already holds is skipped.
- **A failure is never yours to handle.** It is logged, the device still takes payments the ordinary way, and the next bring-up tries again.

If you show the merchant their estate, `GET /devices` is your call to make, and `HaloSdkUi.deviceInstallationId(context)` picks out the row for the device in their hand.

**One case the SDK cannot see: you delete this device's own row.** `DELETE /devices/{id}` leaves the SDK still holding the token it last registered with, which is exactly what the skip check above compares against, so it keeps skipping forever. Tell it:

```kotlin
HaloSdkUi.forgetTerminalRegistration(context)
```

Nothing registers on the spot. The next merchant token the SDK is handed does, by the same path every other registration takes. Call it right after a successful delete of *this device's* row; deleting another terminal's row needs nothing from you.

### What the merchant sees

With the app **open**, the payment opens straight away. Backgrounded, a notification is posted and the payment opens when it is tapped, because Android does not let a backgrounded app start an Activity and a high-priority message does not change that. The notification's copy is the SDK's own, in your configured language, tinted with your primary colour.

Android draws a notification's small icon as a **silhouette off its alpha channel**, so only the mark's shape survives and a mark with no transparent margin reads as a blob. The SDK therefore looks for a drawable your build already generates before rendering anything itself:

1. `ic_notification`, if your app declares one. The escape hatch for a host that wants to draw its own.
2. `ic_launcher_foreground`, the foreground layer of your adaptive launcher icon: your mark on a transparent canvas, already inset. If your build generates one, this is what a pushed payment uses, with no extra artwork.
3. `HDCompanyLogo.icon`, rendered from your SVG on the spot.
4. Your launcher icon, last and only better than nothing, since a launcher icon is opaque edge to edge and silhouettes to a solid block.

These are looked up by resource name, since a library cannot reference your `R`. There is nothing to wire if you already generate `ic_launcher_foreground`.

One loose end is caught on a hook you already call. A message carrying a `notification` block is drawn by the system, and its tap opens **your** launcher activity rather than the SDK's, so `HaloSdkUi.attach` checks the intent it is handed for a pushed payment. Nothing to wire, as long as `attach` is the first line of your `onCreate`.

> The shape of the Firebase message the kernel sends is not part of Halo's published Push to Terminal contract, which stops at the `POST /consumer/push` response. The SDK accepts either plausible shape, a payload carrying the payment link outright (`url` / `link` / `applink` / …) or one naming the payment field by field (`transactionId` / `reference`, `amount`, `currency`, `merchantReference`, `configJwt`), and logs the keys of anything it cannot read. Watch it with `adb logcat -s HaloPush`.

## Telemetry

The SDK can report **what it did and what went wrong** into your own Firebase project. Off by default, and never carrying a payment's details. Both switches live in your [brand file](#theming):

```json
{
  "analytics": true,
  "crashReports": true
}
```

Two switches, because they are two different bargains, and `crashReports` without `analytics` is a perfectly ordinary brand, as is the reverse. Both are off by default deliberately: this reports into *your* project, and an SDK that started writing into it uninvited would be making your privacy decision for you. It needs the same `google-services.json` [Push to Terminal](#your-firebase-project) needs and nothing else. With no project, or the flag off, no provider comes up and the SDK says so once in the log.

Every signal goes through one interface, so which backends a brand reports to is a list in one file, [`HDTelemetry.kt`](https://github.com/halo-dot/halo_sdk_ui/blob/main/lib/src/main/java/za/co/synthesis/halo/sdk_ui/core/HDTelemetry.kt). Firebase Analytics and Crashlytics are the two that ship; a brand reporting to its acquirer's collector adds a provider and changes nothing else.

### What it reports

**Nothing is instrumented screen by screen.** Every signal comes from a seam the SDK already had, which is why a new screen or a new failure is measured from the day it exists.

| Where | Reports |
|-------|---------|
| `HaloSdkUi.attach` | `sdk_started`, the denominator everything else is read against. A crash before any config existed is queued and flushed when the providers come up |
| `HDBoot` | How long a bring-up took, which door the payment arrived by, and on failure the named phase it stopped in and the *type* of throwable |
| `HDBoot`'s uncaught guard | The crashes nothing handled, as the SDK's only fatals |
| `Cubit.async` / `background` | `sdk_action_finished` per operation: its label, whether it worked, the milliseconds the cardholder waited |
| `Cubit.fail` | Every handled failure, as a non-fatal with the trail of what the cubit was doing |
| `Cubit.emit` | That trail: a line per change of *stage*, never the state itself |
| `HDApi` | Every kernel round-trip as a breadcrumb, and as an event by masked endpoint |
| `HDRoutes` | Screen views, from the navigation state rather than from the pages |
| The payment SDK's callbacks | The two verdicts only they hold: whether the payment stack came up, and whether the acquirer approved |

Six event names in total, all prefixed `sdk_`. The prefix earns its place: the project is yours, and if you run the same design in your own app, one unprefixed column would carry two apps' operations and answer neither's question.

### What it can never carry

Decided in one place, not by a call site. `HDTelemetry.scrub` drops any parameter whose key names an **amount, tip, reference, token, card, address or credential**, however the call site labelled it, and any value that *looks* like a person (an `@`, or a run of seven digits or more). Request paths are masked, so `/transactions/9f2c…/receipt/pdf` reports as `/transactions/{id}/receipt/pdf`. The merchant is a salted hash of the JWT subject the device registered under, scoped to **your** package name, so two brands cannot join their users. The one deliberate exception is a crash report's throwable, handed over whole, which is what crash reporting is.

It also cannot break a payment. Every call is fire-and-forget, every provider call is guarded, and bring-up always succeeds: a backend that will not come up is dropped with a line in the log rather than waited on. Nothing here touches a network on a thread a card read is waiting on.

Watch it on a debuggable build with `adb logcat -s HDTelemetry`. Every signal is logged as well as sent, so a signal in logcat but not in a dashboard is a Firebase problem rather than a wiring one.

### Two things to know

- **Both Firebase libraries are on your classpath because this library brings them**, the way `firebase-messaging` already is, so Firebase's own automatic collection becomes available to your project once its resources exist. The SDK never touches your collection flags in either direction. Our switches decide only whether **the SDK** reports.
- **Minified release builds need your own Crashlytics Gradle plugin** for readable stacks. Mapping-file upload is an application-module job, and a library cannot do it.

## Example application

See the [example app](https://github.com/halo-dot/halo_sdk_ui/tree/main/example-app) for a complete working integration.

## License

Copyright © 2026 Halo Dot. All rights reserved. Use of this SDK is subject to the Halo Terms of Service.

## Support

[Halo Developer Portal](https://docs.halodot.io/docs/category/intents)
