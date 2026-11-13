---
sidebar_class_name: hidden
---

# halo_sdk_ui

[![Platform](https://img.shields.io/badge/platform-Android-green.svg)](https://developer.android.com)
[![Min SDK](https://img.shields.io/badge/minSDK-29-blue.svg)](https://android-arsenal.com/api?level=29)
[![sdk_ui](https://img.shields.io/badge/sdk__ui-0.0.57-f57500.svg)](https://docs.halodot.io)

A React Native plugin for **Halo Dot tap-on-phone payments**. It wraps the
native [`sdk_ui`](https://docs.halodot.io) library behind one TypeScript class,
`HaloSdkUi`, so a React Native app can take a card payment on the phone itself
without writing native code or holding a bridge module.

The native SDK owns the whole payment experience — amount entry, the
card-reading screens, the PIN pad, the result screen and the receipt. This
plugin is the bridge: it hands your calls to the SDK and hands the SDK's
answers back to JavaScript.

> **Android only.** There is no `sdk_ui` for iOS yet, so the TurboModule is
> registered on Android alone. On any other platform the module is not
> registered and the calls reject, which a cross-platform host should guard for.

> **New architecture.** This is a TurboModule and requires React Native's new
> architecture (the default on current React Native). A host on the old
> architecture will not resolve it.

## Contents

[What you get](#what-you-get) · [Requirements](#requirements) · [Installation](#installation) · [Quick start](#quick-start) · [The API](#the-api) · [The token provider](#the-token-provider) · [The receipt provider](#the-receipt-provider) · [Branding](#branding) · [Taking a payment](#taking-a-payment) · [Printing](#printing) · [Testing](#testing)

## What you get

- **The whole payment UI, from JavaScript.** One call opens the SDK's native tap flow and returns the result.
- **Two lines of native code**, both in your `MainActivity` — an import and one call. Nothing else.
- **The surrounding surfaces too** — NFC state and settings, scanned payment links, camera coordination, the Push to Terminal device id, language, theme mode, and the browser hand-off for a link on a domain the SDK claims.
- **Receipt printing on MobiPOS and Zebra devices** — one-shot text/HTML, or a structured `Receipt` of typed lines, printed on the device's built-in or connected thermal printer. See [Printing](#printing).

## Requirements

| Requirement | Detail |
|-------------|--------|
| Platform | Android only |
| React Native | New architecture (TurboModules) enabled — the default on current React Native |
| Android Gradle Plugin | A version supporting `compileSdk = 37` |
| Kotlin | **2.4.0** — `sdk_ui`'s AAR metadata is built with it, and an older compiler cannot read it. Pin it in your project `build.gradle` (see [below](#2-pin-the-toolchain-and-sdk-levels)) |
| `minSdkVersion` | **29** or higher (the SDK's floor) |
| `compileSdk` | **37** or higher (the SDK's AAR metadata requires it) |
| Host `Activity` | The default `ReactActivity` already works — see [below](#1-attach-the-sdk-in-mainactivityoncreate) |
| Halo artifact credentials | An AWS access key and secret, to resolve `sdk_ui` from the Halo S3 Maven repository |
| A Halo SDK token (JWT) | Issued by Halo; supplied to the plugin via [`onTokenRequest`](#the-token-provider) |
| A brand file | `android/app/src/main/assets/halo/brand.json` — see [Branding](#branding) |

## Installation

### 1. Attach the SDK in `MainActivity.onCreate`

`HaloSdkUi.attach` is the one call the plugin cannot make for you, and it goes
on the first line after `super.onCreate`. The default `ReactActivity` already
extends `AppCompatActivity`, which is an `androidx.activity.ComponentActivity` —
the host type the SDK's Jetpack Compose UI needs — so **no base-class change is
required**:

```kotlin
// android/app/src/main/java/.../MainActivity.kt
import android.os.Bundle
import com.facebook.react.ReactActivity
import za.co.synthesis.halo.sdk_ui.HaloSdkUi

class MainActivity : ReactActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        HaloSdkUi.attach(this, savedInstanceState)
    }

    // ... getMainComponentName(), createReactActivityDelegate() unchanged
}
```

Two things make this yours rather than the plugin's. It loads the payment
kernel, which is the longest single step of bringing the SDK up, and a
TurboModule is created well after `onCreate` — so attaching there would move
that cost onto whoever is waiting next. And `savedInstanceState` exists only
here: it is what lets the SDK restore its own state across a process death, and
what tells a genuine launch from a recreated Activity, which is the difference
between opening a pushed payment and charging it twice.

Skipping it is legal — `prepare` and `init` attach again — and costs the speed,
the restore and the notification-tap path.

You need no `sdk_ui` dependency of your own: the plugin exposes it.

### 2. Pin the toolchain and SDK levels

In your project-level `android/build.gradle`, pin Kotlin to 2.4.0 and the SDK
levels the plugin needs. React Native's version catalog otherwise resolves an
older Kotlin, whose compiler cannot read `sdk_ui`'s 2.4.0 metadata:

```groovy
// android/build.gradle
buildscript {
    ext {
        buildToolsVersion = "37.0.0"
        minSdkVersion = 29        // the SDK's floor
        compileSdkVersion = 37    // the SDK's AAR metadata requires it
        targetSdkVersion = 36
        kotlinVersion = "2.4.0"   // sdk_ui's metadata is built with it
    }
    dependencies {
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion")
    }
}
```

### 3. Add the Halo repository

`sdk_ui` is published to Halo's private S3 Maven repository, which authenticates
with AWS credentials rather than a username and password. Registering on the
developer portal gets you a key and a secret; put them in your app's
`android/local.properties`, which git ignores:

```properties
aws.accesskey={{your_access_key}}
aws.secretkey={{your_secret_key}}
```

Temporary credentials, such as an SSO session's, carry a third value: add it as `aws.token`, and replace all three when the session expires. S3 answers an expired one with `ExpiredToken` or `InvalidToken`, which reads like a network fault but is not one.

The repository itself goes in **your** build rather than the plugin's. Gradle
resolves each configuration against the repositories of the project doing the
resolving, and `sdk_ui` is fetched twice — once for the plugin library and once
as a transitive dependency of `:app` — so a declaration inside the plugin would
answer for only half of it. `allprojects` answers for both:

```groovy
// android/build.gradle
import java.util.Properties

def haloLocalProperties = new Properties()
def haloLocalPropertiesFile = new File(rootDir, "local.properties")
if (haloLocalPropertiesFile.isFile()) {
    haloLocalPropertiesFile.withInputStream { haloLocalProperties.load(it) }
}

def haloCredential = { String property, String environmentVariable ->
    def fromFile = haloLocalProperties.getProperty(property)
    if (fromFile != null && !fromFile.isBlank()) return fromFile
    def fromEnv = System.getenv(environmentVariable)
    return (fromEnv != null && !fromEnv.isBlank()) ? fromEnv : null
}

allprojects {
    repositories {
        google()
        mavenCentral()
        // The SDK itself: releases holds the published versions, snapshots the
        // candidates.
        ["releases", "snapshots"].each { repository ->
            maven {
                name = repository
                url = uri("s3://synthesis-halo-artifacts/$repository")
                credentials(AwsCredentials) {
                    accessKey = haloCredential("aws.accesskey", "AWS_ACCESS_KEY_ID")
                    secretKey = haloCredential("aws.secretkey", "AWS_SECRET_ACCESS_KEY")
                    sessionToken = haloCredential("aws.token", "AWS_SESSION_TOKEN")
                }
            }
        }
        // The MobiPOS printer SDK (com.mobiiot:mobiiot-api), a transitive
        // dependency of sdk_ui for the receipt printer.
        maven {
            name = "mobiPos"
            url = uri("s3://synthesis-third-party-libs/Mobi-pos-printer")
            credentials(AwsCredentials) {
                accessKey = haloCredential("aws.accesskey", "AWS_ACCESS_KEY_ID")
                secretKey = haloCredential("aws.secretkey", "AWS_SECRET_ACCESS_KEY")
                sessionToken = haloCredential("aws.token", "AWS_SESSION_TOKEN")
            }
        }
        // The Zebra Link-OS SDK (com.zebra:sdk), sdk_ui's transitive dependency
        // for the ZQ620 Bluetooth printer. It lives at a SEPARATE root in the
        // same bucket (zebra, not Mobi-pos-printer), so it needs its own entry —
        // without it the build fails "Could not find com.zebra:sdk".
        maven {
            name = "zebra"
            url = uri("s3://synthesis-third-party-libs/zebra")
            credentials(AwsCredentials) {
                accessKey = haloCredential("aws.accesskey", "AWS_ACCESS_KEY_ID")
                secretKey = haloCredential("aws.secretkey", "AWS_SECRET_ACCESS_KEY")
                sessionToken = haloCredential("aws.token", "AWS_SESSION_TOKEN")
            }
        }
    }
}
```

The environment-variable fallbacks are for CI, which carries no
`local.properties` and exports temporary credentials under those names. A build
that centralises repositories in `dependencyResolutionManagement` declares the
same repositories there instead; the plugin declares none of its own either way,
so nothing here conflicts with `RepositoriesMode.FAIL_ON_PROJECT_REPOS`.

`example/android/build.gradle` is this file, working.

Leave `sdk_ui` itself out of your `dependencies`. The plugin pins the version this release was built against, and a line of your own could only disagree with it: Gradle takes the higher of the two, so a lower pin is ignored and a higher one overrides the plugin without it knowing.

#### Resolve the manifest-merge collisions

The SDK's own manifest declares an application `label` (`SoftPos`) and, through
a transitive dependency, `allowBackup`. Both collide with your app's manifest at
merge time. Add a `tools:replace` so yours wins:

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">
    <application
        android:label="@string/app_name"
        android:allowBackup="false"
        tools:replace="android:label,android:allowBackup"
        ... >
```

#### Sandbox and the build type

`sdk_ui` picks the Halo SDK by **build type**: a debug build gets the SDK's debug artifact, which is the one that talks to the sandbox kernel, and a release build gets the production one. So a `--variant=release` build for a sandbox token, such as a signed QA build, carries the production SDK and fails at the first transaction. If you ship builds like that, force the debug artifact for them in `android/app/build.gradle`:

```groovy
// android/app/build.gradle
def sandbox = true  // however your build knows which kernel it is for

if (sandbox) {
    configurations.all {
        resolutionStrategy.eachDependency { details ->
            def version = details.requested.version ?: ""
            if (details.requested.group == "za.co.synthesis.halo" &&
                details.requested.name == "sdk" &&
                !version.isEmpty() && !version.endsWith("-debug")) {
                details.useVersion("$version-debug")
                details.because("a sandbox build needs the SDK's debug artifact")
            }
        }
    }
}
```

The same kind of rule pins an acquirer-certified kernel version; see "Choosing the payment kernel" in the `sdk_ui` documentation.

### 4. Add the plugin

```sh
npm install halo_sdk_ui
# or
yarn add halo_sdk_ui
```

React Native autolinking registers the TurboModule; no manual package
registration is needed.

## Quick start

```ts
import { HaloSdkUi } from 'halo_sdk_ui';

const halo = new HaloSdkUi();

// 1. Tell the SDK where to get a token. Set before init.
halo.onTokenRequest(async () => myBackend.freshJwt());

// 2. Warm the SDK at your splash. Optional, and faster.
await halo.prepare();

// 3. Bring the SDK up once you have a session.
const outcome = await halo.init();
if (outcome.resultType !== 'Initialized') {
  // outcome.errorCode says why. If the SDK's own error page is already up with
  // it (errorShown === 'true'), show nothing more. Otherwise show it in the
  // SDK's words: errorTitle, errorMessage and errorCodes, as its page does.
}

// 4. Take a payment. Pass an amount, or null to use the SDK's own keypad.
const result = await halo.transact('10.00', 'ZAR', { reference: 'order-1234' });
console.log(result.resultType); // Approved / Declined / Cancelled / …
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
| `prepare()` | `Promise<void>` | Warms branding and artwork. Call at your splash. Resolves at once; cannot fail. |
| `init()` | `Promise<InitResult>` | Brings the SDK up. Resolves with the real outcome. `resultType` is `Initialized`, or absent on a failure, where `errorCode` says why — and on a failure `errorTitle`, `errorMessage` and `errorCodes` (as the SDK's error page words them) plus `errorShown` (`'true'` when that page is already on screen) and `errorSettings` (`'NFC'`/`'APP'`, the settings page that fixes it). Show one failure one way: the SDK's page when it is up, otherwise your own with the SDK's words. |

### Payments

| Method | Returns | What it does |
|--------|---------|--------------|
| `transact(amount, currency, options?)` | `Promise<TransactResult>` | Opens the native payment UI for one charge. `amount` is a decimal string (`"10.00"`) — or **null to let the SDK show its own keypad**. `currency` is `ZAR`/`GBP`/`EUR`/`USD`, or null for the first of your brand file's `currencies`. `options` carries `reference`, `presentation` (`"FULL_SCREEN"` default or `"SHEET"`), and for a card-present refund `refundOf` (the `haloReference` of the original) and `installments`. Returns the tender map (below). |
| `payment(url)` | `Promise<boolean>` | Hands a scanned payment link to the SDK's own activity. Returns whether it launched. |

`transact` returns the outcome plus the tender a till can reconcile against:

| Key | Meaning |
|-----|---------|
| `resultType` | The SDK's own outcome name: `Approved`, `Declined`, `Cancelled`, `CardTapTimeOutExpired`, `NetworkError`… or absent if no card was read |
| `reference` | The acquirer's reconciliation reference |
| `haloReference` | Halo's own reference for the transaction — the one a later refund names as `refundOf` |
| `maskedPan` | The card, already masked by the SDK |
| `authCode` | The acquirer's authorisation code |
| `date` / `time` | The acquirer's own timestamp (the receipt's is the fallback) |

### NFC

| Method | Returns | What it does |
|--------|---------|--------------|
| `nfc()` | `Promise<boolean \| null>` | Tri-state: `null` = no NFC hardware (or no Activity), `true` = on, `false` = present but off. |
| `openNfcSettings()` | `Promise<boolean>` | Opens the system NFC settings page (falls back to wireless settings). Returns whether a page opened. |

### Camera (scan-to-pay)

| Method | Returns | What it does |
|--------|---------|--------------|
| `camera(inUse)` | `Promise<void>` | Coordinates the camera with the payment kernel. Call `camera(true)` before opening your scanner and `camera(false)` after, so the kernel's monitor doesn't cancel a transaction. |

### Push to Terminal

| Method | Returns | What it does |
|--------|---------|--------------|
| `deviceInstallationId()` | `Promise<string \| null>` | This device's Halo installation id — which row it is in the merchant's estate. Null until `init` has registered it at least once. |
| `forgetRegistration()` | `Promise<void>` | Tells the SDK to forget its terminal registration, so it re-registers on the next token. Call after deleting *this device's* estate row. |

### Miscellaneous

| Method | Returns | What it does |
|--------|---------|--------------|
| `sdkInfo()` | `Promise<string \| null>` | The underlying Halo SDK's version string. Available before `init`. |
| `language(code)` | `Promise<void>` | Sets the SDK's language (`"en"`, `"af"`…) to match your app's picker. Null or an unshipped code resets to the SDK's default. |
| `themeMode(mode)` | `Promise<void>` | Sets the payment screens to `"light"`, `"dark"` or `"system"` to match your app's theme switch. Recorded, so an inbound payment follows it too. Null or an unknown mode resets to the brand file's `themeMode`. |
| `browser(url)` | `Promise<boolean>` | Opens `url` in the device browser rather than the SDK — for a link on a domain the SDK's activity claims (e.g. the merchant portal). Returns whether a browser opened it. |

### Printing

The device's built-in (MobiPOS) or connected (Zebra) receipt printer. Separate
from the payment surface — a build can carry a printer and no tap, or a tap and
no printer. See [Printing](#printing).

| Method | Returns | What it does |
|--------|---------|--------------|
| `getPrinter()` | `Promise<PrinterProvider \| null>` | Which printer this device has (`'mobiPos'`/`'zebra'`), or null when it has none. Auto-detected. Call it to decide whether to show a Print action; it also warms the device. No setup call is required before `print` — the printer binds on first use. |
| `print(printable)` | `Promise<void>` | Prints a [`Printable`](#printing) — `Printable.text(...)`, `Printable.html(...)` or `Printable.receipt(...)` — as one job. Rejects with `print_error` on a hardware fault (no paper, overheated, no printer). |
| `scanForPrinters()` | `Promise<HDPrinterDevice[]>` | Discovers reachable external (Zebra) printers for a picker. Never throws. |
| `selectPrinter(device)` | `Promise<void>` | Selects one of the scanned printers; a later `print` goes to it. |
| `startPrinterConnect(options?)` | `Promise<void>` | Opens the SDK's external-printer connect flow. `presentation` is `"FULL_SCREEN"` (default) or `"SHEET"`. |
| `enablePrinterTaps(onTap)` / `disablePrinterTaps()` | `Promise<boolean>` / `Promise<void>` | Tap-to-connect: arm NFC dispatch so a Zebra Print Touch tag resolves and selects a printer, routing each to `onTap`. Returns whether an NFC adapter is present. |
| `onPrinterConnected(onConnected)` | — | Registers a sink the SDK's connect flow pushes its connected printer to. |
| `getPairedPrinters()` / `getSelectedPrinter()` | `Promise<HDPrinterDevice[]>` / `Promise<HDPrinterDevice \| null>` | The SDK's paired list and the currently selected printer. |
| `forgetPrinter(device)` | `Promise<boolean>` | Unpairs a printer; returns whether the unpair took. |
| `isPrinterBonded(address)` / `isPrinterReachable(device)` | `Promise<boolean>` | Whether a printer is still bonded, and whether it answers right now. |
| `onReceiptRequest(provider)` | — | Registers the receipt the SDK prints on its *own* result screen for an approved charge — see [The receipt provider](#the-receipt-provider). Optional. |
| `setReceiptOptions(options?)` | `Promise<void>` | Narrows which receipt actions (`share`, `print`) the SDK's result screen offers, within what the brand allows. |

## The token provider

Every call into the Halo SDK needs a valid, short-lived JWT. The plugin does
**not** know how to get one — your app does. So you register a callback, and the
plugin invokes it whenever the SDK asks:

```ts
halo.onTokenRequest(async () => {
  // Return a fresh JWT — typically from your backend, refreshed as needed.
  return await myBackend.freshJwt();
});
```

Set this **before** `init`; the SDK cannot come up without a token. The callback
is async, so fetching the token over the network needs no extra plumbing.
Register it once; a later call swaps the provider rather than stacking a second.
The SDK asks through this callback whenever it needs a token — at bring-up and
again later as tokens expire — so the provider should always return a
currently-valid one.

### Two methods of providing a token

The plugin only ever asks `onTokenRequest` for a JWT string. How you produce
that string is up to you — there are two methods.

**Method A — provide a token directly.** If you already have a valid JWT —
minted on the [Halo developer portal](https://docs.halodot.io) or by your own
backend — return it from the callback:

```ts
const MY_JWT = 'eyJ…';

halo.onTokenRequest(async () => MY_JWT);
await halo.prepare();
await halo.init();
await halo.transact('10.00', 'ZAR');
```

This is the quickest way to get a charge working. Note that a token provided
this way is static, and JWTs are short-lived (typically ~15 minutes). When it
expires, the SDK's next request hands back the stale one and the charge fails
with a JWT-expired error — provide a fresh token. Good for a demo or a manual
test.

**Method B — mint a fresh token on demand.** Have the provider fetch or mint a
token each time the SDK asks, so it is always valid:

```ts
halo.onTokenRequest(async () => myBackend.freshJwt());
```

`freshJwt()` is your own function — it returns a cached token while it has life
left and fetches a new one as it nears expiry (your backend signs it with your
portal RSA key, or exchanges a merchant session for it). Because the SDK asks
through the callback whenever it needs a token, a provider that always returns a
fresh one needs no other plumbing. Use this when the token must stay valid over
a session.

## The receipt provider

Some receipts the SDK cannot build itself — a till that formats its own slip and
hands it back only after the card clears, say. For those, register a receipt
provider and the SDK's **own result screen** will print it on an approved
charge:

```ts
halo.onReceiptRequest(async (tender) => {
  // `tender` is the acquirer's record of the charge the SDK just approved —
  // {reference, maskedPan, authCode, date, time} — because your own `transact`
  // has not returned yet. A till that must be told which card paid builds that
  // call from these, and returns the slip it hands back:
  const slip = await myTill.tender(tender);
  return {
    receiptResponse: slip.receiptText,   // the slip text
    transactionBarcode: slip.barcode,    // Code 128 at the foot (optional)
    parking: { lines: [                  // a typed section printed first (optional)
      new QrLine(slip.parkingData),
      new TextLine('Scan to view your parking'),
    ] },
  };
  // ...or return null to let the SDK print its own transaction record.
});
```

The SDK calls this on an approved charge, just before its result screen renders,
and prints what you return there. The `parking` lines are the same typed
[`ReceiptLine`](#printing) model `print` uses. It is **optional and
best-effort**: register none and the SDK prints its own record; return `null`,
throw, or answer too slowly and it falls back to that record — a slow or failed
till never holds a settled charge's screen.

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
push) brings the SDK up *natively, with no JS running*, so it has to be able to
paint and address itself with no host code involved.

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

`example/android/app/src/main/assets/halo/brand.json` is a working file.

## Taking a payment

`transact` opens the SDK's native payment UI and returns when the transaction is
done. The merchant taps the card on the device; the SDK draws every screen. Your
app supplies the amount and gets the outcome — it draws none of the payment UI
itself.

```ts
const result = await halo.transact('49.99', 'ZAR', { reference: 'invoice-7781' });
switch (result.resultType) {
  case 'Approved':
    // result.reference, result.maskedPan, result.authCode … for a till to
    // reconcile against. See the tender table above.
    break;
  case 'Declined':
    break;
  default: // Cancelled, timeout, or absent — no card was read.
}
```

Pass an amount and the SDK opens straight on the tap screen. Pass **null** and
the SDK shows **its own keypad** first, so an app with no amount-entry UI of its
own can still take a payment:

```ts
await halo.transact(null, 'ZAR');                              // the merchant enters the amount on the SDK's keypad
await halo.transact('10.00', 'ZAR', { presentation: 'SHEET' }); // a bottom sheet, not full-screen
```

A **card-present refund** gives the amount back to the card instead of taking
it, naming the original transaction's `haloReference`:

```ts
await halo.transact('49.99', 'ZAR', { refundOf: originalHaloReference });
```

## Printing

The plugin also drives the device's thermal receipt printer — the **MobiPOS
MP5**'s built-in printer, or a connected **Zebra** Bluetooth printer. This is a
separate capability from tap-on-phone payments: a device may have a printer and
no payment stack, or the reverse, so the two share no state and neither depends
on the other.

> On a device with no supported printer the calls reach the plugin but resolve
> to null (`getPrinter`) or reject (`print`), and on any other platform the
> module is not registered — the same guard the payment calls need.

### How it differs from payments

The payment calls answer a failure with a null (a call between screens is the
ordinary state). A printer is hardware, so `print` does the opposite: a failure
— no paper, overheated, no supported printer — is a **rejected promise** with a
code you can act on (`print_error`, `bad_args`). Guard a print, don't ignore its
result.

### Quick start

```ts
import { HaloSdkUi, Printable } from 'halo_sdk_ui';

const halo = new HaloSdkUi();

// No setup call — the printer binds on first use. Optionally check first, to
// decide whether to show a Print action (this also warms the device):
const provider = await halo.getPrinter(); // null on a device with no printer

// One-shot primitives.
await halo.print(Printable.text('Hello, world'));
await halo.print(Printable.html('<h1>Receipt</h1><p>Total: R25.00</p>'));
```

### A structured receipt

A `Receipt` is an ordered list of typed lines, each with its own formatting.
This is the path a "Print Receipt" button reaches for — a title, line items, a
divider, a QR of the reference — composed and printed as one correctly-spaced
job.

```ts
import {
  Printable, Receipt, TextLine, DividerLine, QrLine, FeedLine, PrintAlign,
} from 'halo_sdk_ui';

await halo.print(Printable.receipt(new Receipt([
  new TextLine('Halo Dot', { size: 34, bold: true, align: PrintAlign.center }),
  new FeedLine(),
  new TextLine('Approved', { align: PrintAlign.center }),
  new DividerLine(),
  new TextLine('Amount   R25.00'),
  new TextLine('Card     **** 1234'),
  new TextLine('Auth     A1B2C3'),
  new DividerLine(),
  new QrLine('order-1234', { size: 240 }),
  new FeedLine(2),
])));
```

The line kinds:

| Line | What it prints |
|------|----------------|
| `TextLine(text, {size, bold, underline, align})` | A line of text. `size` is a pixel size (24 body, 34 title); `align` is `PrintAlign.left`/`.center`/`.right`. |
| `ImageLine(base64, {centered})` | A base64 PNG/JPEG (a `data:` URI prefix is tolerated). Anything wider than the paper is scaled down; a narrower image is centred by default. |
| `QrLine(data, {size})` | A QR code rendered from `data`, `size`×`size` pixels. |
| `BarcodeLine(data, {symbology, showText})` | A 1D barcode (`code128` by default), with the human-readable value below the bars. Centred. |
| `DividerLine({label, fill})` | A full-width rule — plain dashes, or a label followed by `fill` running to the width. |
| `FeedLine(lines?)` | Blank vertical space — `lines` empty lines, one by default. |

Order is preserved exactly: the lines print top to bottom in the order given.

### Setup

No host code is needed for printing — unlike `HaloSdkUi.attach`, the printer
binds its device SDK itself, lazily, on the first `print` (or on `getPrinter`,
which warms it). The printer SDKs (MobiPOS, Zebra) are transitive dependencies
of `sdk_ui`, resolved from the S3 repositories you declared in
[step 3](#3-add-the-halo-repository) — a host that wires those up gets printing
with nothing more to add.

## Testing

The TypeScript layer is unit-tested against a mock native module — the method
names, the argument shapes and the return unwrapping for every call, including
the reverse token/receipt/printer-tap event bridges:

```sh
yarn test
```

Typecheck and lint:

```sh
yarn typecheck
yarn lint
```

## License

Copyright © 2026 Halo Dot. All rights reserved. See the `LICENSE` file in the plugin package.

## Support

[Halo Developer Portal](https://docs.halodot.io)
