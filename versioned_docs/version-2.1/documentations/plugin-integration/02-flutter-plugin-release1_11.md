# Integration Guide for Flutter Plugin Release 1.11

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

- A developer account — register on the **<a href="https://go.developerportal.qa.haloplus.io/" target="_blank">Developer Portal</a>**
- Signed **Non‑Disclosure Agreement (NDA)** (available on the portal)
- **Public/Private key pair** to generate JWTs
- **Kotlin** `1.3.72` *(>= `1.4.x` introduces breaking changes for this setup)*
- **Flutter** `2.10.5` *(pin with [FVM](https://fvm.app/) if your global Flutter differs)*
- **Dart** `2.9.2` *(see notes below; testing references `2.16.2` DevTools `2.9.2`)*
- **Java** `11`
- IDE — **Android Studio** recommended
- **Recommended packages**
  - <a href="https://pub.dev/packages/permission_handler" target="_blank">permission_handler ^11.0.0</a>
  - <a href="https://pub.dev/packages/dart_jsonwebtoken" target="_blank">dart_jsonwebtoken ^2.4.2</a>

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

1. Access the **<a href="https://go.developerportal.qa.haloplus.io/" target="_blank">Developer Portal</a>** and register
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

# Using FVM (to pin Flutter 2.10.5)
fvm spawn 2.10.5 create . --project-name my_sdk_flutter_plugin --org za.co.synthesis.halo.test.plugin
```

### Environment

1. **Kotlin**: The Android SDK was built with **Kotlin 1.3.72**. Stay on this line; `>= 1.4.x` introduces breaking changes for this configuration. In `android/build.gradle` ensure:

   ```gradle
   ext {
     kotlin_version = '1.3.72' // <-- version defined here
   }
   buildscript {
     dependencies {
       classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version" // <-- used here
     }
   }
   ```

2. **Java**: Tested with **Java 11**.

3. **Flutter / Dart**: Tested with **Flutter 2.10.5** and **Dart 2.16.2** (DevTools `2.9.2`).

4. **Android minSdk**: Ensure `minSdkVersion` is **29** or higher in `android/app/build.gradle`:

   ```gradle
   defaultConfig {
     applicationId "za.co.synthesis.halo.sdkflutterplugin_example"
     minSdkVersion 29 // <-- 29 or higher
     // ...
   }
   ```

5. If you encounter `minSdkVersion` or version catalog issues, see the [FAQ](#faq--troubleshooting).

### Plugin Installation

1. Add the plugin to your Flutter project:

   ```bash
   flutter pub add halo_sdk_flutter_plugin
   ```

2. (Recommended) Add permissions helper:

   ```bash
   flutter pub add permission_handler
   ```

3. Configure access to Halo’s S3‑hosted Maven artifacts. From the **Developer Portal**, copy `accesskey` and `secretkey` and add to `android/local.properties`:

   ```properties
   aws.accesskey=<accesskey>
   aws.secretkey=<secretkey>
   ```

   > **Note**: Values are case‑sensitive. Do not commit this file.

4. Ensure your app module Gradle loads `local.properties` (usually present):

   ```gradle
   def localProperties = new Properties()
   def localPropertiesFile = rootProject.file('local.properties')
   if (localPropertiesFile.exists()) {
     localPropertiesFile.withReader('UTF-8') { reader -> localProperties.load(reader) }
   }
   ```

5. Configure repositories and dependency substitutions compatible with Kotlin `1.3.72` in `android/build.gradle`:

   ```gradle
   allprojects {
     repositories {
       google()
       mavenCentral() // <-- for Kotlin 1.3.72
       maven { url 'https://jitpack.io' }
     }
     configurations.all {
       resolutionStrategy.cacheChangingModulesFor 1, 'days'
       resolutionStrategy.dependencySubstitution {
         substitute(module("androidx.core:core-ktx")).with(module("androidx.core:core-ktx:(*, 1.3.2]"))
         substitute(module("org.jetbrains.kotlin:kotlin-stdlib-jdk7")).with(module("org.jetbrains.kotlin:kotlin-stdlib-jdk7:(*, 1.3.72]"))
         substitute(module("org.jetbrains.kotlin:kotlin-stdlib-jdk8")).with(module("org.jetbrains.kotlin:kotlin-stdlib-jdk7:(*, 1.3.72]"))
         substitute(module("androidx.window:window-java")).with(module("androidx.core:core-ktx:(*, 1.3.2]"))
         substitute(module("com.google.firebase:firebase-analytics-ktx")).with(module("com.google.firebase:firebase-analytics-ktx:19.0.0"))
       }
     }
   }
   ```

---

## Mobile Backend Requirements

### JWT

All calls to the Halo SDK require a **valid JWT**. The values required to build the JWT (issuer, audience/host, etc.) are available in the **Developer Portal** (see [Registration Steps](#registration-steps)). We recommend using <a href="https://pub.dev/packages/dart_jsonwebtoken" target="_blank">dart_jsonwebtoken</a> to generate JWTs.

Create two files: `config.dart` (credentials) and `jwt_token.dart` (JWT creation).

**`config.dart`**

```dart
class Config {
  static const String privateKeyPem = String.fromEnvironment('PRIVATE_KEY', defaultValue: '');
  static const String issuer = "{get from the Developer portal}";
  static const String username = "{get from the Developer portal}";
  static const String merchantId = "{get from the Developer portal}";
  static const String host = "{get from the Developer portal}";
  static const String aud = "{get from the Developer portal}";
  static const String ksk = "{get from the Developer portal}";
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
    final token = jwt.sign(key, algorithm: JWTAlgorithm.RS512);
    return token;
  }
}
```

> **Security**: Do **not** store the private key in your repository. Use environment variables or a secure secret manager. Provide the JWT when the SDK invokes `onRequestJWT`.

### JWT Lifetime

Keep JWT lifetimes **short**. A lifetime of **15 minutes** is recommended to limit exposure.

### JWT Signing Public Key Format

Publish the JWT public key as a certificate in a text‑friendly format, e.g., **Base64‑encoded PEM** (`.crt`, `.pem`).

### JWT Claims

Include the following claims (standard unless noted):

| Field | Type | Notes |
| --- | --- | --- |
| `alg` | String | RSA‑signed SHA‑256 (alias **RS256**) or the algorithm required by your tenant. Asymmetric signing preserves non‑repudiation. |
| `sub` | String | Payment Processor Merchant‑User ID, or Application ID. |
| `iss` | String | Unique identifier for the JWT issuer (configured by Synthesis/Halo). Obtain from the **Developer Portal**. |
| `aud` | String | URL of the Halo server TLS endpoint (e.g., `kernelserver.qa.haloplus.io`; environment‑specific). |
| `usr` | String | Username of the user performing the transaction. |
| `iat` | NumericDate | UTC time when the JWT was issued. |
| `exp` | NumericDate | UTC expiration time. |
| `aud_fingerprints` | String | CSV of expected SHA‑256 fingerprints for the Kernel Server TLS endpoint (supports rotation). |

Validate by POSTing to:

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
    <uses-permission android:name="android.permission.READ_PHONE_STATE"/>
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS"/>
    <uses-permission android:name="android.permission.VIBRATE"/>
</manifest>
```

> If you also use `permission_handler`, ensure your `compileSdkVersion` and `targetSdkVersion` are **34** or higher.

### Requesting Runtime Permissions

Add to `pubspec.yaml`:

```yaml
dependencies:
  permission_handler: ^11.0.0
```

Run `flutter pub get`, then create `permission.dart` to request permissions before SDK initialization:

```dart
import 'package:flutter/foundation.dart';
import 'package:permission_handler/permission_handler.dart';

Future<void> checkPermissions() async {
  final permissions = <Permission>[
    Permission.camera,
    Permission.phone,
    Permission.storage,
    Permission.notification,
    Permission.location,
  ];

  for (final p in permissions) {
    await requestPermission(p);
  }
}

Future<void> requestPermission(Permission permission) async {
  final status = await permission.status;
  if (status.isGranted) {
    debugPrint('$permission permission is granted, not requesting');
    return;
  }

  if (status.isPermanentlyDenied) {
    debugPrint('$permission permission is permanently denied, enable in settings');
    return;
  }

  final result = await permission.request();
  if (result.isPermanentlyDenied) {
    debugPrint('$permission permission is permanently denied, enable in settings');
  }
}
```

### Extend `HaloActivity` on Android

Your Android `MainActivity` **Kotlin** class (e.g., `app/src/main/kotlin/<appId>/MainActivity.kt`) must extend `HaloActivity` (which extends `FlutterFragmentActivity`) to hook into SDK lifecycle methods:

```kotlin
import za.co.synthesis.halo.sdkflutterplugin.HaloActivity

class MainActivity : HaloActivity() { }
```

### Implement Halo Callbacks

Implement `IHaloCallbacks` to receive SDK events:

```dart
// halo_sdk.dart
import './jwt_token.dart';

class HaloCallbacks implements IHaloCallbacks {
  @override
  void onAttestationError(HaloAttestationHealthResult details) {
    debugPrint('example app: attestation error: $details');
  }

  @override
  void onHaloTransactionResult(HaloTransactionResult result) {
    debugPrint('example app: transaction result: $result');
  }

  @override
  void onHaloUIMessage(HaloUIMessage message) {
    debugPrint('example app: UI message: $message');
  }

  @override
  void onInitializationResult(HaloInitializationResult result) {
    debugPrint('example app: initialization message: $result');
  }

  @override
  void onRequestJWT(void Function(String jwt) callback) {
    debugPrint('example app: onRequestJWT');
    final jwt = JwtToken.getJwt();
    callback(jwt);
  }

  @override
  void onSecurityError(errorCode) {
    debugPrint('example app: security error: $errorCode');
  }
}
```

### Initialize the SDK

Call initialization when the widget/screen that handles payments is displayed:

```dart
void onInitializeSdk(BuildContext context) {
  final haloCallbacks = HaloCallbacks();
  const package = 'za.co.synthesis.halo.sdkflutterplugin_example';
  const appVersion = '0.0.2';
  const onStartTransactionTimeOut = 300000; // ms
  try {
    Sdkflutterplugin.initializeHaloSDK(
      haloCallbacks,
      package,
      appVersion,
      onStartTransactionTimeOut,
    );
  } on PlatformException catch (e) {
    final message = 'SDK initialisation error: ${e.code} ${e.message}';
    // e.g. setUiMessage(UiMessage(message, Colors.red));
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

- **<a href="https://halo-dot-developer-docs.gitbook.io/halo-dot/sdk" target="_blank">Halo Dot SDK Docs</a>**

---

## Testing

- All transactions are **null and void** until the **NDA** is executed.
- You can test with a virtual card, e.g., **<a href="https://apkpure.com/visa-mobile-cdet/com.visa.app.cdet" target="_blank">Visa Mobile CDET</a>**.

---

## FAQ / Troubleshooting

**My `android/build.gradle` looks different**

> Newer Android Studio templates may define Kotlin as `ext.kotlin_version = '1.3.72'`. Ensure it matches the version required above.

**How do I set `compileSdkVersion` when it’s defined as `flutter.compileSdkVersion`?**

Add values to `android/local.properties`:

```properties
sdk.dir=/home/{me}/android-sdk/
flutter.sdk=/home/{me}/fvm/versions/2.10.5
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

**How do I set my `minSdkVersion` if it’s currently `flutter.minSdkVersion`?**

See the configuration above — define it in `local.properties` and read it from Gradle.

**I am not able to import the Halo SDK.**

- Open the Android folder in **Android Studio** and run **Gradle Sync**
- Ensure the plugin is installed: `flutter pub add halo_sdk_flutter_plugin`
- Verify versions: **Java 11**, **Kotlin 1.3.72**, **Flutter 2.10.5**
- Set `minSdkVersion` **≥ 29**
- Set `compileSdkVersion` and `targetSdkVersion` **≥ 34**
- Ensure `aws.accesskey` and `aws.secretkey` are correctly set in `local.properties`

---