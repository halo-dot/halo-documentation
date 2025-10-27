# Integration Guide for Flutter Plugin Release 2.0

A production-focused guide to integrating the **Halo Dot SDK** via the **halo_sdk_flutter_plugin** in a Flutter Android application.

> **Scope**: Android-only at present. This guide consolidates requirements, environment setup, installation, JWT and backend integration, usage patterns, testing, and troubleshooting.

![Halo Dot SDK Architecture](https://static.dev.haloplus.io/static/mpos/readme/assets/full_process_MIPS_1200.png)

---

## Table of Contents

- [Overview](#overview)
- [Requirements](#requirements)
- [Developer Portal Registration](#developer-portal-registration)
  - [Registration Steps](#registration-steps)
- [Getting Started](#getting-started)
  - [Create/Prepare the Flutter App](#createprepare-the-flutter-app)
  - [Environment](#environment)
  - [Plugin Installation](#plugin-installation)
- [Mobile Backend Requirements](#mobile-backend-requirements)
  - [JWT](#jwt)
  - [JWT Lifetime](#jwt-lifetime)
  - [JWT Signing Public Key Format](#jwt-signing-public-key-format)
  - [JWT Claims](#jwt-claims)
- [Usage in Your Flutter App](#usage-in-your-flutter-app)
  - [Android Permissions](#android-permissions)
  - [Requesting Runtime Permissions](#requesting-runtime-permissions)
  - [Extend `HaloActivity` on Android](#extend-haloactivity-on-android)
  - [Implement Halo Callbacks](#implement-halo-callbacks)
  - [Initialize the SDK](#initialize-the-sdk)
  - [Start a Transaction](#start-a-transaction)
- [Documentation](#documentation)
- [Testing](#testing)
- [FAQ / Troubleshooting](#faq--troubleshooting)

---

## Overview

The **Halo Dot SDK** is an **isolating MPoC SDK** for payment processing with attestation and monitoring capabilities. The architecture diagram above illustrates the SDK boundary, integrator touchpoints, and interactions with third‑party payment gateways.

---

## Requirements

You’ll need the following to integrate the Halo Dot SDK:

- A developer account — register on the **<a href="https://halo.developerportal.dev.haloplus.io/" target="_blank">Developer Portal</a>**
- Executed **Non‑Disclosure Agreement (NDA)** (available on the portal)
- **Public/Private key pair** to generate JWTs (upload the **public** key on the portal)
- **Kotlin** `2.0.21` *(newer version work-in-progress)*
- **Flutter** `3.27.3` *(newer version work-in-progress)*
- **Dart** `3.6.1` *(bundled with Flutter)*
- **Java** `21`
- IDE — **Android Studio** recommended
- **Recommended Flutter packages**
  - <a href="https://pub.dev/packages/permission_handler" target="_blank">permission_handler ^11.3.1</a>
  - <a href="https://pub.dev/packages/dart_jsonwebtoken" target="_blank">dart_jsonwebtoken ^2.16.2</a>

> **Android SDK levels**
>
> - `minSdkVersion`: **29** or higher
> - `compileSdkVersion`: **34** or higher
> - `targetSdkVersion`: **34** or higher

---

## Developer Portal Registration

You must register on the **QA/UAT** environment before testing in production. The developer portal allows you to:

1. Accept the Non Disclosure Agreement(NDA)
2. Access the SDK
3. Submit your public key (for JWT verification)
4. Obtain JWT configuration details (issuer, audience/host, etc.)
5. Obtain AWS access key and secret key (use to download the SDK)

### Registration Steps

1. Access the **<a href="https://halo.developerportal.dev.haloplus.io/" target="_blank">Developer Portal</a>** and register
2. Verify your account via OTP
3. Click **Access to the SDK**
   
   <img src="https://static.dev.haloplus.io/static/mpos/readme/assets/access_sdk.jpg" width="450" alt="access key." />

4. Download and accept the NDA
5. Submit your **public key** and create an **Issuer** name (used to verify your JWT)

   <img src="https://static.dev.haloplus.io/static/mpos/readme/assets/public_key.png" alt="public key." width="450" />

6. Retrieve your **Access key** and **Secret key** — these are used in your IDE to access the Halo SDK (see [Plugin Installation](#plugin-installation))

   <img src="https://static.dev.haloplus.io/static/mpos/readme/assets/access_key.png" alt="access key." width="450" />

---

## Getting Started

### Create/Prepare the Flutter App

Create a new Flutter app or integrate into an existing one. **Android** must be added (currently the only supported platform).

```bash
# Using Flutter
flutter create . --project-name my_sdk_flutter_plugin --org za.co.synthesis.halo.test.plugin

# Using FVM (recommended for pinning Flutter versions)
fvm spawn 3.27.3 create . --project-name my_sdk_flutter_plugin --org za.co.synthesis.halo.test.plugin
```

### Environment

1. **Java**: Tested with **Java 21** (later versions not yet confirmed).
2. **Flutter/Dart**: Tested with **Flutter 3.27.3** and **Dart 3.6.1** (DevTools `2.40.2`).
3. **Android minSdk**: Ensure `minSdkVersion` is **29** or higher in `android/app/build.gradle`:

   ```gradle
   defaultConfig {
     applicationId "za.co.synthesis.halo.sdkflutterplugin_example"
     minSdkVersion 29 // <-- 29 or higher
     // ...
   }
   ```

4. If you encounter issues setting `minSdkVersion`, see the [FAQ](#faq--troubleshooting).

### Plugin Installation

1. Add the plugin to your Flutter project:

   ```bash
   flutter pub add halo_sdk_flutter_plugin
   ```

2. (Recommended) Add permissions helper:

   ```bash
   flutter pub add permission_handler
   ```

3. **Configure Halo Maven access** (SDK binaries are hosted on AWS S3). Retrieve your `accesskey` and `secretkey` from the **Developer Portal** and add them to `android/local.properties` (create the file if it doesn’t exist):

   ```properties
   aws.accesskey=<accesskey>
   aws.secretkey=<secretkey>
   ```

   > **Note**: Keys are case‑sensitive. Keep them out of source control.

4. Ensure your Gradle script loads `local.properties` (typically in `android/app/build.gradle`):

   ```gradle
   def localProperties = new Properties()
   def localPropertiesFile = rootProject.file('local.properties')
   if (localPropertiesFile.exists()) {
     localPropertiesFile.withReader('UTF-8') { reader ->
       localProperties.load(reader)
     }
   }
   ```

---

## Mobile Backend Requirements

### JWT

All calls to the Halo SDK require a **valid JWT**. The values needed to build the JWT (issuer, audience/host, etc.) are available in the **Developer Portal** (see [Registration Steps](#registration-steps)). We recommend using <a href="https://pub.dev/packages/dart_jsonwebtoken" target="_blank">dart_jsonwebtoken</a> to generate JWTs.

Create two files: `config.dart` (credentials) and `jwt_token.dart` (JWT creation).

**`config.dart`**

```dart
class Config {
  static const String privateKeyPem = String.fromEnvironment('PRIVATE_KEY', defaultValue: '');
  static const String issuer = '{get from the Developer Portal}';
  static const String username = '{get from the Developer Portal}';
  static const String merchantId = '{get from the Developer Portal}';
  static const String host = '{get from the Developer Portal}';
  static const String aud = '{get from the Developer Portal}';
  static const String ksk = '{get from the Developer Portal}';
}
```

**`jwt_token.dart`**

```dart
import 'package:dart_jsonwebtoken/dart_jsonwebtoken.dart';
import './config.dart';

class JwtToken {
  static String getJwt() {
    final jwt = JWT(
      {
        'aud_fingerprints': Config.aud,
        'ksk_pin': Config.ksk,
        'usr': Config.username,
      },
      audience: Audience([Config.host]),
      issuer: Config.issuer,
      subject: Config.merchantId,
    );

    final key = RSAPrivateKey(Config.privateKeyPem);
    // IMPORTANT: Use the algorithm configured for your tenant in the Developer Portal.
    // Example shows RS512; some environments may require RS256.
    final token = jwt.sign(key, algorithm: JWTAlgorithm.RS512);
    return token;
  }
}
```

> **Security**
>
> - Do **not** commit the private key to your repo. Use secure configuration (env vars, secret managers).
> - Provide the JWT via the SDK callback `onRequestJWT`.

### JWT Lifetime

Keep JWT lifetimes **short** to minimize risk. A lifetime of **15 minutes** is recommended.

### JWT Signing Public Key Format

Publish the JWT public key as a **certificate** in a text‑friendly format (e.g., **Base64‑encoded PEM** `.crt`/`.pem`).

### JWT Claims

The JWT must include the following (standard unless noted):

| Field | Type | Notes |
| --- | --- | --- |
| `alg` | String | RSA algorithm used for signing (e.g., **RS256** or **RS512**). Follow the value configured for your environment to maintain non‑repudiation. |
| `sub` | String | Payment Processor Merchant‑User ID or Application ID. |
| `iss` | String | Unique identifier for the JWT issuer (as configured by Synthesis/Halo). Retrieve from the **Developer Portal**. |
| `aud` | String | URL of the Halo server TLS endpoint (environment‑specific, e.g. `kernelserver.qa.haloplus.io`). |
| `usr` | String | Username of the user performing the transaction. |
| `iat` | NumericDate | UTC issuance timestamp. |
| `exp` | NumericDate | UTC expiration timestamp. |
| `aud_fingerprints` | String | CSV of expected SHA‑256 fingerprints for the Kernel Server TLS endpoint (supports rotation). |

To validate values, POST to:

```
https://kernelserver.qa.haloplus.io/<sdk-version>/tokens/checkjwt
```

with **Bearer** auth.

---

## Usage in Your Flutter App

### Android Permissions

Declare required permissions in `AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="za.co.synthesis.halo.sdkflutterplugin_example">

    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.NFC"/>
    <uses-permission android:name="android.permission.CAMERA"/>

    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />

    <uses-permission android:name="android.permission.READ_PHONE_STATE"/>
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS"/>
    <uses-permission android:name="android.permission.VIBRATE"/>

    <uses-permission android:name="android.permission.BLUETOOTH" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
    <uses-permission android:name="android.permission.BLUETOOTH_SCAN"
        android:usesPermissionFlags="neverForLocation" />

    <uses-feature
        android:name="android.hardware.camera"
        android:required="false" />
</manifest>
```

Ensure `compileSdkVersion` and `targetSdkVersion` are **34** or higher.

### Requesting Runtime Permissions

Add to `pubspec.yaml`:

```yaml
dependencies:
  permission_handler: ^11.3.1
```

Run `flutter pub get` after editing `pubspec.yaml`.

Create `permission.dart` to request permissions before SDK initialization:

```dart
import 'package:flutter/foundation.dart';
import 'package:permission_handler/permission_handler.dart';

Future<void> checkPermissions() async {
  final permissions = <Permission>{
    Permission.camera,
    Permission.bluetoothConnect,
    Permission.bluetoothScan,
    Permission.location,
  };

  for (final p in permissions) {
    await _requestPermission(p);
  }
}

Future<void> _requestPermission(Permission permission) async {
  final status = await permission.status;
  if (status.isGranted) {
    debugPrint('$permission already granted');
    return;
  }

  final result = await permission.request();
  if (result.isPermanentlyDenied) {
    debugPrint('$permission permanently denied — prompt user to enable in Settings');
  }
}
```

### Extend `HaloActivity` on Android

Your `MainActivity` (e.g., `app/src/main/kotlin/<appId>/MainActivity.kt`) must extend `HaloActivity` (which itself extends `FlutterFragmentActivity`) to hook into SDK lifecycle methods:

```kotlin
import za.co.synthesis.halo.sdkflutterplugin.HaloActivity

class MainActivity : HaloActivity()
```

### Implement Halo Callbacks

Implement `IHaloCallbacks` to receive SDK events:

```dart
// halo_sdk.dart
import 'package:flutter/services.dart';
import 'package:flutter/material.dart';

// import your JwtToken helper
import './jwt_token.dart';

class HaloCallbacks implements IHaloCallbacks {
  @override
  void onAttestationError(HaloAttestationHealthResult details) {
    debugPrint('attestation error: $details');
  }

  @override
  void onHaloTransactionResult(HaloTransactionResult result) {
    debugPrint('transaction result: $result');
  }

  @override
  void onHaloUIMessage(HaloUIMessage message) {
    debugPrint('UI message: $message');
  }

  @override
  void onInitializationResult(HaloInitializationResult result) {
    debugPrint('initialization: $result');
  }

  @override
  void onRequestJWT(void Function(String jwt) callback) {
    debugPrint('onRequestJWT');
    final jwt = JwtToken.getJwt();
    callback(jwt);
  }

  @override
  void onSecurityError(errorCode) {
    debugPrint('security error: $errorCode');
  }

  @override
  void onCameraControlLost() {
    debugPrint('camera control lost');
  }
}
```

### Initialize the SDK

Call initialization when the widget/screen that handles payments is displayed:

```dart
void onInitializeSdk(BuildContext context) {
  final haloCallbacks = HaloCallbacks();
  const packageName = 'za.co.synthesis.halo.sdkflutterplugin_example';
  const appVersion = '0.0.2';
  const startTxnTimeoutMs = 300000; // 5 minutes

  try {
    Sdkflutterplugin.initializeHaloSDK(
      haloCallbacks,
      packageName,
      appVersion,
      startTxnTimeoutMs,
    );
  } on PlatformException catch (e) {
    final message = 'SDK initialisation error: ${e.code} ${e.message}';
    // Replace with your app’s UI messaging
    debugPrint(message);
  }
}
```

### Start a Transaction

```dart
Sdkflutterplugin.startTransaction(1.00, 'Some merchant reference', 'ZAR');
```

From this point, UI messages and results will arrive via your callbacks. Use them to update your UI accordingly.

---

## Documentation

- **<a href="/docs/documentations/sdk/getting-started-with-sdk" target="_blank">Halo Dot SDK Docs</a>**

---

## Testing

- All transactions are **null and void** until the **NDA** is executed.
- You can test with a virtual card, e.g., **<a href="https://apkpure.com/visa-mobile-cdet/com.visa.app.cdet" target="_blank">Visa Mobile CDET</a>**.

---

## FAQ / Troubleshooting

**Q: How do I set `compileSdkVersion` when it’s defined as `flutter.compileSdkVersion`?**

Add values to `android/local.properties`:

```properties
sdk.dir=/home/{me}/android-sdk/
flutter.sdk=/home/{me}/fvm/versions/3.27.3
flutter.buildMode=debug
flutter.versionName=1.0.0
flutter.versionCode=1
flutter.compileSdkVersion=34
flutter.minSdkVersion=29
```

Reference them in `android/app/build.gradle`:

```gradle
android {
  compileSdkVersion localProperties.getProperty('flutter.compileSdkVersion').toInteger()
  defaultConfig {
    minSdkVersion localProperties.getProperty('flutter.minSdkVersion').toInteger()
  }
}
```

**Q: How do I set my `minSdkVersion` if it’s currently set as `flutter.minSdkVersion`?**

See the configuration above — define it in `local.properties` and read it from Gradle.

**Q: I’m not able to import the Halo SDK.**

- Open the Android folder in **Android Studio** and run **Gradle Sync**
- Ensure the plugin is installed: `flutter pub add halo_sdk_flutter_plugin`
- Verify versions: **Java 21**, **Kotlin 2.0.21**, **Flutter 3.27.3**
- Set `minSdkVersion` **≥ 29**
- Set `compileSdkVersion` and `targetSdkVersion` **≥ 34**
- Ensure `aws.accesskey` and `aws.secretkey` are correctly set in `local.properties`

> **Algorithm note**: Some snippets show `RS512` while claim tables reference `RS256`. **Always use the algorithm specified for your tenant in the Developer Portal**. If mismatched, signature validation will fail.

---