---
sidebar_class_name: hidden
---

# halo_sdk_ui

[![Platform](https://img.shields.io/badge/platform-Android-green.svg)](https://developer.android.com)
[![Min SDK](https://img.shields.io/badge/minSDK-29-blue.svg)](https://android-arsenal.com/api?level=29)
[![sdk_ui](https://img.shields.io/badge/sdk__ui-0.0.44-f57500.svg)](https://docs.halodot.io)

A Flutter plugin for **Halo Dot tap-on-phone payments**. It wraps the native
[`sdk_ui`](https://docs.halodot.io) library behind one Dart class, `HaloSdkUi`,
so a Flutter app can take a card payment on the phone itself without writing
native code or holding a `MethodChannel`.

The native SDK owns the whole payment experience — amount entry, the
card-reading screens, the PIN pad, the result screen and the receipt. This
plugin is the bridge: it hands your calls to the SDK and hands the SDK's
answers back to Dart.

> **Android only.** There is no `sdk_ui` for iOS yet, so the pubspec declares
> Android alone. On any other platform every call throws a
> `MissingPluginException`, which a cross-platform host should guard for.

## Contents

[What you get](#what-you-get) · [Requirements](#requirements) · [Installation](#installation) · [Quick start](#quick-start) · [The API](#the-api) · [The token provider](#the-token-provider) · [The receipt provider](#the-receipt-provider) · [Branding](#branding) · [Taking a payment](#taking-a-payment) · [Printing](#printing) · [Testing](#testing)

## What you get

- **The whole payment UI, from Dart.** One call opens the SDK's native tap flow and returns the result.
- **Two lines of native code**, both in your `MainActivity` — a base class and one call. Nothing else.
- **The surrounding surfaces too** — NFC state and settings, scanned payment links, camera coordination, the Push to Terminal device id, language, and the browser hand-off for a link on a domain the SDK claims.
- **Receipt printing on MobiPOS devices** — one-shot text/HTML, or a structured `Receipt` of typed lines, printed on the device's built-in thermal printer. See [Printing](#printing).

## Requirements

| Requirement | Detail |
|-------------|--------|
| Platform | Android only |
| Android Gradle Plugin | **9.0 or later**, which is what `compileSdk = 37` needs. Kotlin comes from AGP itself; a host that sets `android.builtInKotlin=false` has the plugin apply `org.jetbrains.kotlin.android` for its own module instead |
| `minSdkVersion` | **29** or higher (the SDK's floor) |
| `compileSdk` | **37** or higher (the SDK's AAR metadata requires it) |
| Host `Activity` | Must be a **`FlutterFragmentActivity`** — see [below](#1-make-mainactivity-a-flutterfragmentactivity) |
| Halo artifact credentials | An AWS access key and secret, to resolve `sdk_ui` from the Halo S3 Maven repository |
| A Halo SDK token (JWT) | Issued by Halo; supplied to the plugin via [`onTokenRequest`](#the-token-provider) |
| A brand file | `android/app/src/main/assets/halo/brand.json` — see [Branding](#branding) |

## Installation

### 1. Make `MainActivity` a `FlutterFragmentActivity`

The SDK's UI is Jetpack Compose and needs an `androidx.activity.ComponentActivity`
host. The default `FlutterActivity` is **not** one; `FlutterFragmentActivity`
is. Without this the plugin never holds an Activity, and every Activity-dependent
call — `nfc`, `prepare`, `init`, `transact` — answers null, false or
`no_activity` instead of doing anything.

### 2. Attach the SDK in `onCreate`

`HaloSdkUi.attach` is the one call the plugin cannot make for you, and it goes
on the first line after `super.onCreate`:

```kotlin
// android/app/src/main/kotlin/.../MainActivity.kt
import android.os.Bundle
import io.flutter.embedding.android.FlutterFragmentActivity
import za.co.synthesis.halo.sdk_ui.HaloSdkUi

class MainActivity : FlutterFragmentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        HaloSdkUi.attach(this, savedInstanceState)
    }
}
```

Two things make this yours rather than the plugin's. It loads the payment
kernel, which is the longest single step of bringing the SDK up, and a plugin is
handed its Activity well after `onCreate` — so attaching there would move that
cost onto whoever is waiting next. And `savedInstanceState` exists only here: it
is what lets the SDK restore its own state across a process death, and what
tells a genuine launch from a recreated Activity, which is the difference
between opening a pushed payment and charging it twice.

Skipping it is legal — `prepare` and `init` attach again — and costs the speed,
the restore and the notification-tap path.

You need no `sdk_ui` dependency of your own: the plugin exposes it.

### 3. Add the Halo repository

`sdk_ui` is published to Halo's private S3 Maven repository, which authenticates
with AWS credentials rather than a username and password. Registering on the
developer portal gets you a key and a secret; put them in your app's
`android/local.properties`, which git ignores:

```properties
aws.accesskey={{your_access_key}}
aws.secretkey={{your_secret_key}}
```

Temporary credentials, such as an SSO session's, carry a third value: add it as `aws.token`, and replace all three when the session expires. S3 answers an expired one with `ExpiredToken`, which reads like a network fault but is not one.

The repository itself goes in **your** build rather than the plugin's. Gradle
resolves each configuration against the repositories of the project doing the
resolving, and `sdk_ui` is fetched twice — once for the plugin library and once
as a transitive dependency of `:app` — so a declaration inside the plugin would
answer for only half of it. `allprojects` answers for both:

```kotlin
// android/build.gradle.kts
import java.util.Properties

val localProperties = Properties().apply {
    val file = File(rootDir, "local.properties")
    if (file.isFile) file.inputStream().use { load(it) }
}

fun haloCredential(property: String, environmentVariable: String): String? =
    localProperties.getProperty(property)?.takeIf { it.isNotBlank() }
        ?: System.getenv(environmentVariable)?.takeIf { it.isNotBlank() }

allprojects {
    repositories {
        google()
        mavenCentral()
        listOf("releases", "snapshots").forEach { repository ->
            maven {
                name = repository
                url = uri("s3://synthesis-halo-artifacts/$repository")
                credentials(AwsCredentials::class) {
                    accessKey = haloCredential("aws.accesskey", "AWS_ACCESS_KEY_ID")
                    secretKey = haloCredential("aws.secretkey", "AWS_SECRET_ACCESS_KEY")
                    sessionToken = haloCredential("aws.token", "AWS_SESSION_TOKEN")
                }
            }
        }
    }
}
```

The environment-variable fallbacks are for CI, which carries no
`local.properties` and exports temporary credentials under those names. A build
that centralises repositories in `dependencyResolutionManagement` declares the
same repository there instead; the plugin declares none of its own either way,
so nothing here conflicts with `RepositoriesMode.FAIL_ON_PROJECT_REPOS`.

`example/android/build.gradle.kts` is this file, working.

Leave `sdk_ui` itself out of your `dependencies`. The plugin pins the version this release was built against, and a line of your own could only disagree with it: Gradle takes the higher of the two, so a lower pin is ignored and a higher one overrides the plugin without it knowing.

#### Sandbox and the build type

`sdk_ui` picks the Halo SDK by **build type**: a debug build gets the SDK's debug artifact, which is the one that talks to the sandbox kernel, and a release build gets the production one. So `flutter build apk --release` for a sandbox token, such as a signed QA build, carries the production SDK and fails at the first transaction. If you ship builds like that, force the debug artifact for them in `android/app/build.gradle.kts`:

```kotlin
val sandbox = true  // however your build knows which kernel it is for

if (sandbox) {
    configurations.all {
        resolutionStrategy.eachDependency {
            val version = requested.version.orEmpty()
            if (requested.group == "za.co.synthesis.halo" && requested.name == "sdk" &&
                version.isNotBlank() && !version.endsWith("-debug")
            ) {
                useVersion("$version-debug")
                because("a sandbox build needs the SDK's debug artifact")
            }
        }
    }
}
```

The same kind of rule pins an acquirer-certified kernel version; see "Choosing the payment kernel" in the `sdk_ui` documentation.

### 4. Add the plugin

```yaml
# pubspec.yaml
dependencies:
  halo_sdk_ui: ^0.2.9
```

### 5. Set `minSdk` and `compileSdk`

```kotlin
// android/app/build.gradle.kts
android {
    compileSdk = 37
    defaultConfig { minSdk = 29 }
}
```

## Quick start

```dart
import 'package:halo_sdk_ui/halo_sdk_ui.dart';

final halo = HaloSdkUi();

// 1. Tell the SDK where to get a token. Set before init.
halo.onTokenRequest(() async => myBackend.freshJwt());

// 2. Warm the SDK at your splash. Optional, and faster.
await halo.prepare();

// 3. Bring the SDK up once you have a session.
final outcome = await halo.init();
if (outcome['resultType'] != 'Initialized') {
  // outcome['errorCode'] says why. If the SDK's own error page is already up
  // with it (errorShown == 'true'), show nothing more. Otherwise show it in the
  // SDK's words: errorTitle, errorMessage and errorCodes, as its page does.
}

// 4. Take a payment. Pass an amount, or null to use the SDK's own keypad.
final result = await halo.transact('10.00', 'ZAR', reference: 'order-1234');
print(result['resultType']); // Approved / Declined / Cancelled / …
```

**The order is the design.** Each call needs strictly more than the one before
it, so each can run the moment that thing exists: `prepare` needs only your
brand file, `init` needs a token, `transact` needs a live SDK.

## The API

Everything is a method on `HaloSdkUi`.

### Bring-up

| Method | Returns | What it does |
|--------|---------|--------------|
| `onTokenRequest(provider)` | — | Registers the callback the SDK calls for a fresh JWT. Set before `init`. |
| `prepare()` | `Future<void>` | Warms branding and artwork. Call at your splash. Returns at once; cannot fail. |
| `init()` | `Future<Map<String, String?>>` | Brings the SDK up. Suspends until the real outcome. Returns `{resultType, errorCode}` — `resultType` is `Initialized`, or null on a failure, where `errorCode` says why — and on a failure `errorTitle`, `errorMessage` and `errorCodes` (as the SDK's error page words them) plus `errorShown` (`'true'` when that page is already on screen). Show one failure one way: the SDK's page when it is up, otherwise your own with the SDK's words. |

### Payments

| Method | Returns | What it does |
|--------|---------|--------------|
| `transact(amount, currency, {reference, presentation})` | `Future<Map<String, String?>>` | Opens the native payment UI for one charge. `amount` is a decimal string (`"10.00"`) — or **null to let the SDK show its own keypad**. `currency` is `ZAR`/`GBP`/`EUR`/`USD`, or null for the first of your brand file's `currencies` (the rand unless you narrowed the list). `reference` is optional; `presentation` is `"FULL_SCREEN"` (default) or `"SHEET"`. Returns the tender map (below). |
| `payment(url)` | `Future<bool>` | Hands a scanned payment link to the SDK's own activity. Returns whether it launched. |

`transact` returns the outcome plus the tender a till can reconcile against:

| Key | Meaning |
|-----|---------|
| `resultType` | The SDK's own outcome name: `Approved`, `Declined`, `Cancelled`, `CardTapTimeOutExpired`, `NetworkError`… or null if no card was read |
| `reference` | The acquirer's reconciliation reference |
| `maskedPan` | The card, already masked by the SDK |
| `authCode` | The acquirer's authorisation code |
| `date` / `time` | The acquirer's own timestamp (the receipt's is the fallback) |

### NFC

| Method | Returns | What it does |
|--------|---------|--------------|
| `nfc()` | `Future<bool?>` | Tri-state: `null` = no NFC hardware (or no Activity), `true` = on, `false` = present but off. |
| `openNfcSettings()` | `Future<bool>` | Opens the system NFC settings page (falls back to wireless settings). Returns whether a page opened. |

### Camera (scan-to-pay)

| Method | Returns | What it does |
|--------|---------|--------------|
| `camera(inUse)` | `Future<void>` | Coordinates the camera with the payment kernel. Call `camera(true)` before opening your scanner and `camera(false)` after, so the kernel's monitor doesn't cancel a transaction. |

### Push to Terminal

| Method | Returns | What it does |
|--------|---------|--------------|
| `deviceInstallationId()` | `Future<String?>` | This device's Halo installation id — which row it is in the merchant's estate. Null until `init` has registered it at least once. |
| `forgetRegistration()` | `Future<void>` | Tells the SDK to forget its terminal registration, so it re-registers on the next token. Call after deleting *this device's* estate row. Native: `HaloSdkUi.forgetTerminalRegistration`. |

### Miscellaneous

| Method | Returns | What it does |
|--------|---------|--------------|
| `sdkInfo()` | `Future<String?>` | The underlying Halo SDK's version string. Available before `init`. |
| `language(code)` | `Future<void>` | Sets the SDK's language (`"en"`, `"af"`…) to match your app's picker. Null or an unshipped code resets to the SDK's default. |
| `themeMode(mode)` | `Future<void>` | Sets the payment screens to `"light"`, `"dark"` or `"system"` to match your app's theme switch. Recorded, so an inbound payment follows it too. Null or an unknown mode resets to the brand file's `themeMode`. |
| `browser(url)` | `Future<bool>` | Opens `url` in the device browser rather than the SDK — for a link on a domain the SDK's activity claims (e.g. the merchant portal). Returns whether a browser opened it. |

### Printing

The MobiPOS MP5 device's built-in receipt printer. Separate from the payment
surface — a build can carry a printer and no tap, or a tap and no printer — and
**MobiPOS-only**. See [Printing](#printing).

| Method | Returns | What it does |
|--------|---------|--------------|
| `getPrinter()` | `Future<PrinterProvider?>` | Which printer this device has, or null when it has none. Auto-detected. Call it to decide whether to show a Print action; it also warms the device, so the first `print` after it is quick. No setup call is required before `print` — the printer binds on first use. |
| `print(printable)` | `Future<void>` | Prints a [`Printable`](#printing) — `Printable.text(...)`, `Printable.html(...)` or `Printable.receipt(...)` — as one job. Binds the printer on first use. Throws `print_error` on a hardware fault (no paper, overheated). |
| `onReceiptRequest(provider)` | — | Registers the receipt the SDK prints on its *own* result screen for an approved charge — see [The receipt provider](#the-receipt-provider). Optional. |

## The token provider

Every call into the Halo SDK needs a valid, short-lived JWT. The plugin does
**not** know how to get one — your app does. So you register a callback, and the
plugin invokes it whenever the SDK asks:

```dart
halo.onTokenRequest(() async {
  // Return a fresh JWT — typically from your backend, refreshed as needed.
  return await myBackend.freshJwt();
});
```

Set this **before** `init`; the SDK cannot come up without a token. The callback
is async, so fetching the token over the network needs no extra plumbing. See
the Halo developer portal for how the JWT is issued and what claims it carries.

## The receipt provider

Some receipts the SDK cannot build itself — a till that formats its own slip and
hands it back only after the card clears, say. For those, register a receipt
provider and the SDK's **own result screen** will print it on an approved
charge:

```dart
halo.onReceiptRequest((tender) async {
  // `tender` is the acquirer's record of the charge the SDK just approved —
  // {reference, maskedPan, authCode, date, time} — because your own `transact`
  // has not returned yet. A till that must be told which card paid builds that
  // call from these, and returns the slip it hands back:
  final slip = await myTill.tender(tender);
  return {
    'receiptResponse': slip.receiptText,     // printed with `clean: true`
    'transactionBarcode': slip.barcode,       // Code 128 at the foot (optional)
    'parkingBarcode': slip.parkingBarcode,    // QR at the top (optional)
  };
  // ...or return null to let the SDK print its own transaction record.
});
```

The SDK calls this on an approved charge, just before its result screen renders,
and prints what you return there (the brand logo above the slip, the barcode at
its foot). It is **optional and best-effort**: register none and the SDK prints
its own record; return `null`, throw, or answer too slowly and it falls back to
that record — a slow or failed till never holds a settled charge's screen.

## Branding

Everything about the SDK's *appearance and addressing* — colours, logo, corner
radius, which card schemes to show, the language, the payment-link scheme, the
kernel those links resolve against, `receivePush`, `receipt`, `dcc` and the
telemetry switches — is **not** passed through this plugin. The SDK reads it
from a file your app ships:

```
android/app/src/main/assets/halo/brand.json
```

This is deliberate. The SDK's config (`HDConfig`) carries only the two things a
file cannot hold — the host Activity and the token callback — and the plugin
supplies both. Everything else is a file because an inbound payment (a link, a
push) brings the SDK up *natively, with no Flutter engine running*, so it has to
be able to paint and address itself with no host code involved.

A `brand.json`, from the example app in this repository:

```json
{
  "light": { "primary": "#FF292CF5", "secondary": "#FF292CF5" },
  "dark":  { "primary": "#FF292CF5", "secondary": "#FF292CF5" },
  "shape": 20,
  "language": "en",
  "presentation": "SHEET",
  "showTransactionResult": {
    "share": ["email", "sms"],
    "qr": true,
    "print": ["nfc", "bluetooth"],
    "autoClose": 30
  },
  "analytics": true,
  "crashReports": true
}
```

Every key is optional; what you leave out is Halo's default. Colours are
`#AARRGGBB`.

`showTransactionResult` is everything the SDK's own result screen offers:
`share` is the receipt channels (an empty list removes Share), `qr` whether the
receipt QR is drawn on the screen and the printed slip (on unless `false`, and
independent of `share`), `print` the ways an external printer may be connected (`nfc`, `bluetooth`; an empty list prints
only on a printer the device finds itself, and leaving it out turns printing
off), and `autoClose` the seconds the screen counts down before closing itself
(off unless set). `false` turns the result screens off altogether.

Two more keys, `kernel` and `kernelPins`, name the kernel your payment links
resolve against and the certificate that authenticates it. They are needed only
for the one link shape that carries a reference and no `configJwt` — every other
flow reads the address off the token. Halo issues both values with your
credentials, for the environment your token is issued for; they are not written
down here, because a kernel address and its pin are yours and go stale. Ask your
Halo contact, and see the `sdk_ui` documentation, which lists every key.

`example/android/app/src/main/assets/halo/brand.json` is a working file with
every key commented.

## Taking a payment

`transact` opens the SDK's native payment UI and returns when the transaction is
done. The merchant taps the card on the device; the SDK draws every screen. Your
app supplies the amount and gets the outcome — it draws none of the payment UI
itself.

```dart
final result = await halo.transact('49.99', 'ZAR', reference: 'invoice-7781');
switch (result['resultType']) {
  case 'Approved':
    // result['reference'], result['maskedPan'], result['authCode'] … for a
    // till to reconcile against. See the tender table above.
    break;
  case 'Declined':
    break;
  default: // Cancelled, timeout, or null — no card was read.
}
```

Pass an amount and the SDK opens straight on the tap screen. Pass **null** and
the SDK shows **its own keypad** first, so an app with no amount-entry UI of its
own can still take a payment:

```dart
await halo.transact(null, 'ZAR');            // the merchant enters the amount on the SDK's keypad
await halo.transact('10.00', 'ZAR', presentation: 'SHEET'); // a bottom sheet, not full-screen
```

## Printing

The plugin also drives the **MobiPOS MP5**'s built-in thermal receipt printer.
This is a separate capability from tap-on-phone payments: a device may have a
printer and no payment stack, or the reverse, so the two share no state and
neither depends on the other.

> **MobiPOS only.** Printing is bridged over the device's own SDK
> (`mp-mobiiot-sdk`), vendored into this plugin. On a non-MobiPOS device the
> calls reach the plugin but the device SDK will not bind, and on any other
> platform they throw a `MissingPluginException` — the same guard the payment
> calls need.

### How it differs from payments

The payment calls answer a failure with a null (a call between screens is the
ordinary state). A printer is hardware, so `print` does the opposite: a failure
— no paper, overheated, no supported printer — is a thrown `PlatformException`
with a code you can act on (`print_error`, `bad_args`). Guard a print, don't
ignore its result.

### Quick start

```dart
import 'package:halo_sdk_ui/halo_sdk_ui.dart';

final halo = HaloSdkUi();

// No setup call — the printer binds on first use. Optionally check first, to
// decide whether to show a Print action (this also warms the device):
final provider = await halo.getPrinter(); // null on a device with no printer

// One-shot primitives.
await halo.print(const Printable.text('Hello, world'));
await halo.print(const Printable.html('<h1>Receipt</h1><p>Total: R25.00</p>'));
```

### A structured receipt

A `Receipt` is an ordered list of typed lines, each with its own formatting.
This is the path a "Print Receipt" button reaches for — a title, line items, a
divider, a QR of the reference — composed and printed as one correctly-spaced
job.

```dart
await halo.print(const Printable.receipt(Receipt([
  TextLine('Halo Dot', size: 34, bold: true, align: PrintAlign.center),
  FeedLine(),
  TextLine('Approved', align: PrintAlign.center),
  DividerLine(),
  TextLine('Amount   R25.00'),
  TextLine('Card     **** 1234'),
  TextLine('Auth     A1B2C3'),
  DividerLine(),
  QrLine('order-1234', size: 240),
  FeedLine(2),
])));
```

The line kinds:

| Line | What it prints |
|------|----------------|
| `TextLine(text, {size, bold, underline, align})` | A line of text. `size` is a pixel size (24 body, 34 title); `align` is `PrintAlign.left`/`.center`/`.right`. |
| `ImageLine(base64, {centered})` | A base64 PNG/JPEG (a `data:` URI prefix is tolerated). Anything wider than the paper is scaled down; a narrower image is centred by default. |
| `QrLine(data, {size})` | A QR code rendered from `data`, `size`×`size` pixels. |
| `DividerLine()` | A full-width dashed rule. |
| `FeedLine([lines])` | Blank vertical space — `lines` empty lines, one by default. |

Order is preserved exactly: the lines print top to bottom in the order given.

### Setup

No host code is needed for printing — unlike `HaloSdkUi.attach`, the printer
binds its device SDK itself, lazily, on the first `print` (or on `getPrinter`,
which warms it), against the plugin's application context. The MobiPOS SDK ships as a local AAR, vendored at
`android/libs/mp-mobiiot-sdk-4.5.1.aar` and referenced from the plugin's own
`build.gradle.kts`, so a host that takes this plugin gets printing with nothing
to add.

## Testing

The Dart layer is unit-tested against a mock method channel — the method names,
the argument shapes and the return unwrapping for every call, including the
reverse `getToken` bridge:

```bash
flutter test
```

The native layer's tests cover what the plugin answers with no Activity
attached, which is the ordinary state between a host's screens. They run through
the example app's Gradle build, so run the example once first — that is what
creates its wrapper:

```bash
cd example/android && ./gradlew :halo_sdk_ui:testDebugUnitTest
```

## License

Copyright © 2026 Halo Dot. All rights reserved. See the `LICENSE` file in the plugin package.

## Support

[Halo Developer Portal](https://docs.halodot.io)
