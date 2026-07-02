---
sidebar_class_name: hidden
---

# Test App Setup Guide

Use this guide to launch and run the **Halo SDK Flutter plugin test app** (<a href="https://github.com/halo-dot/halo_sdk_plugins/tree/main/test_apps/flutter" target="_blank">GitHub link</a>).
<br/>This reference application allows you to quickly verify your end-to-end integration in a sandbox environment.

> 📘 **Looking for the full integration guide?**<br/>
> For a comprehensive, step-by-step guide on integrating the plugin into your own production application, see the official <a href="https://pub.dev/packages/halo_sdk_flutter_plugin" target="_blank">Plugin Documentation on pub.dev</a>.

---

## 1. Prerequisites

Before getting started, ensure your environment matches the validated development stack below:

* **Java:** JDK **17** *(Earlier or later versions have not been tested)*
* **Flutter:** **3.24.0**
* **Dart:** **3.5.0** *(DevTools 2.37.2)*
* **Android Toolchain:** Properly configured Android SDK, platform tools, and an active emulator or physical test device.
* **Version Control:** Git installed.

You can verify your local environment versions by running:

```bash
java -version
flutter --version

```

---

## 2. Clone and Open the Repository

Clone the plugin repository and navigate directly to the Flutter test application subdirectory:

```bash
# Clone the repository
git clone https://github.com/halo-dot/halo_sdk_plugins

# Navigate to the Flutter test app directory
cd halo_sdk_plugins/test_apps/flutter

```

Once inside, open the `test_apps/flutter` directory in your preferred IDE (such as VS Code or Android Studio).

---

## 3. Configure Android AWS Credentials

The Android side of the test app requires AWS credentials to resolve dependencies.

Create a new file (or edit the existing one) at `test_apps/flutter/android/local.properties` and add your access keys:

```properties
aws.accesskey={{your_access_key}}
aws.secretkey={{your_secret_key}}

```

> ⚠️ **Security Warning:** Never commit real credentials to your version control system. Keep `local.properties` added to your `.gitignore` file.

---

## 4. Install Project Dependencies

Fetch the required Flutter packages by running the following command from the root of the `test_apps/flutter` directory:

```bash
flutter pub get

```

---

## 5. Configure JWT (for Testing)

The test app includes a local utility to generate JSON Web Tokens (JWT) for authentication during testing. You need to configure your environment variables in the source files.

### Step A: Update `lib/config.dart`

Provide your specific private keys and environment targets:

```dart
// lib/config.dart
class Config {
  static const String privateKeyPem = """{{YOUR_PRIVATE_KEY_PEM}}"""; // <-- Add private key here (Do not commit this file with real keys!)
  static const String issuer = "{{YOUR_ISSUER}}";                     // <-- Add your issuer string
  static const String username = "{{YOUR_USERNAME}}";                 // <-- Add your test username
  static const String merchantId = "{{MID}}";                         // <-- Add your Merchant ID (MID)
  static const String host = "{{HOST}}";                             // <-- e.g., kernelserver.qa.haloplus.io
  static const String aud = "{{AUD}}";                               // <-- Add your audience key
  static const String ksk = "{{KSK}}";                               // <-- Add your KSK pin
}

```

### Step B: Verify `lib/jwt_token.dart`

Ensure the token payload structure matches your environment expectations:

```dart
// lib/jwt_token.dart
final jwt = JWT(
  {
    'aud_fingerprints': Config.aud, 
    'ksk_pin': Config.ksk, 
    'usr': Config.username
  },
  audience: Audience([Config.host]),
  issuer: Config.issuer,
  subject: Config.merchantId,
);

```

---

## 6. Run the Application

Launch the application using your IDE's run tools or directly from your terminal:

```bash
flutter run

```

If prompted, select your connected Android physical device or active emulator from the target list.

---

## 7. Verify Successful Integration

Once the app is running, check off the following milestones to ensure complete setup:

* [ ] **Build Check:** The application builds and boots up on the device without throwing compilation errors.
* [ ] **UI Accessibility:** Halo SDK features exposed by the plugin are interactive and visible within the test app UI layout.
* [ ] **Network Health:** Outbound network calls complete successfully using your supplied AWS and JWT configurations.

---

## Troubleshooting

If you run into issues while launching the test application, review these common solutions:

| Issue | Cause | Resolution |
| --- | --- | --- |
| **Java compilation / gradle errors** | Wrong active Java version. | Ensure your `JAVA_HOME` environment variable explicitly points to **JDK 17**. |
| **Plugin / Package dependency mismatches** | Toolchain versions mismatched. | Ensure you are using **Flutter 3.24.0** and **Dart 3.5.0**. |
| **Stale build cache errors** | Outdated or cached artifacts. | Clear local cache and re-fetch: run `flutter clean && flutter pub get`. |
| **Dependency resolution or AWS errors** | Missing or invalid local properties. | Double-check that your `android/local.properties` contains valid `aws.accesskey` and `aws.secretkey` variables. |
| **Authentication or handshake failures** | Invalid or expired token payload. | Verify the correctness of your keys, expiration settings, and strings inside `lib/config.dart`. |

---

## Additional Resources

* This repository serves strictly as a reference implementation to showcase idiomatic usage of the SDK plugin.
* For comprehensive API design specs, advanced configuration arguments, and platform-specific native settings, read the Halo SDK Flutter Plugin README.
