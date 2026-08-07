# Integration Guide for Flutter Plugin Release 2.0

A production-focused guide to integrating the <a href="https://docs.halodot.io/docs/documentations/sdk/sdk-integration-guide" target="_blank">**Halo Dot SDK**</a> via the <a href="https://pub.dev/packages/halo_sdk_flutter_plugin" target="_blank">**halo_sdk_flutter_plugin**</a> in a Flutter Android application.

> **Scope**: Android-only at present. This guide consolidates requirements, environment setup, installation, JWT and backend integration, usage patterns, testing, and troubleshooting.
---

## Table of Contents

- [Integration Guide for Flutter Plugin Release 2.0](#integration-guide-for-flutter-plugin-release-20)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Requirements](#requirements)
  - [Developer Portal Registration](#developer-portal-registration)
    - [Registration Steps](#registration-steps)
  - [Getting Started](#getting-started)
    - [Create/Prepare the Flutter App](#createprepare-the-flutter-app)
    - [Environment](#environment)
    - [Plugin Installation](#plugin-installation)
  - [Mobile Backend Requirements](#mobile-backend-requirements)
    - [JWT Generation.](#jwt-generation)
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

<hr/>

## Overview

The <a href="https://docs.halodot.io/docs/documentations/sdk/sdk-integration-guide" target="_blank">**Halo Dot SDK**</a> is an **isolating MPoC SDK** for payment processing with attestation and monitoring capabilities. The architecture diagram below illustrates the SDK boundary, integrator touchpoints, and interactions with third‑party payment gateways.

![Halo Dot SDK Architecture](https://static.dev.haloplus.io/static/mpos/readme/assets/full_process_MIPS_1200.png)

## Requirements

You’ll need the following to integrate the Halo Dot SDK:

- A developer account — register on the **<a href="https://go.developerportal.qa.haloplus.io/" target="_blank">Developer Portal</a>**
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

<hr/>
## Developer Portal Registration

You are required to register on our QA (UAT — User Acceptance Testing) environment before testing in production.
The developer portal enables you to obtain the following:

1. Accept the Non-Disclosure Agreement (NDA)
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

<hr/>

## Getting Started

### Create/Prepare the Flutter App

Create a new Flutter app or integrate into an existing one. <br/>
**Android** must be added (currently the only supported platform).

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

3. **Configure Halo Maven access** (SDK binaries are hosted on AWS S3). <br/>
   Retrieve your `accesskey` and `secretkey` from the <a href="https://go.developerportal.qa.haloplus.io/" target="_blank">**Developer Portal**</a> and add them to `android/local.properties` (create the file if it doesn’t exist):

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

## Mobile Backend Requirements

### JWT Generation.

All calls to the Halo SDK require a valid JWT. 

To keep your private key secure, JWTs **must not** be generated directly on the mobile device. Instead, your app should request a signed JWT from your backend server.

Refer to the **[JWT Integration Guide](/docs/documentations/sdk/jwt)** for step-by-step instructions on setting up your backend service, generating RSA key pairs, and implementing the server-side authentication endpoint in your preferred language.

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
When `onRequestJWT` is invoked by the Halo Dot SDK, call the provided `callback` with your JWT, as shown above.

The plugin allows up to 30 seconds for the callback to be invoked. If your JWT fetch (e.g. a network call to your backend) takes longer than that, or fails without calling the callback, the plugin will time out the request on your behalf so the SDK is not left waiting indefinitely.

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

 If your application also needs to use the camera (e.g. for QR/barcode scanning), you need to coordinate access with the SDK, since it uses the camera internally as part of its own monitoring. Call `requestCameraUsage()` before you open your own camera, and `returnCameraUsage()` once you're done with it:
```dart
await Sdkflutterplugin.requestCameraUsage();
// ... open your camera, scan, etc ...
await Sdkflutterplugin.returnCameraUsage();
```
If the SDK reclaims the camera while your app still has it in use, `onCameraControlLost` will be invoked on your `IHaloCallbacks` implementation.

## Documentation

- **<a href="https://docs.halodot.io/docs/documentations/sdk/getting-started-with-sdk" target="_blank">Halo Dot SDK Docs</a>**

## Testing

- All transactions are **null and void** until the **NDA** is executed.
- You can test with a virtual card, e.g., **<a href="https://apkpure.com/visa-mobile-cdet/com.visa.app.cdet" target="_blank">Visa Mobile CDET</a>**.

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
