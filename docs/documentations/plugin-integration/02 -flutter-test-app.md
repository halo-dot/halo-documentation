---
sidebar_class_name: hidden
---

# Test App Setup

Use this guide to run the **Halo SDK Flutter plugin test app** and verify integration end-to-end.

> For the full step by step Flutter plugin integration guide for your app, see the plugin’s
<a href="https://pub.dev/packages/halo_sdk_flutter_plugin" target="_blank">documentation</a>.

---

## 1) Prerequisites

* **Java:** JDK **17**

  > The example was tested on Java 17. Earlier/later versions haven’t been validated.
* **Flutter:** **3.24.0**
* **Dart:** **3.5.0** (DevTools **2.37.2**)
* Android toolchain set up (Android SDK, platform tools, emulator or device)
* Git

Check your setup:

```bash
java -version
flutter --version
```

---

## 2) Get the Source

```bash
git clone https://github.com/halo-dot/halo_sdk_plugins
cd halo_sdk_plugins/test_apps/flutter
```

Open the `test_apps/flutter` directory in your preferred IDE (Android Studio, VS Code, etc.).

---

## 3) Configure AWS Credentials (Android)

Create or edit `test_apps/flutter/android/local.properties` and add:

```properties
aws.accesskey=<accesskey>
aws.secretkey=<secretkey>
```

> ⚠️ **Security tip:** Never commit real credentials. Use placeholders or environment-specific secrets management.

---

## 4) Install Dependencies

From `test_apps/flutter`:

```bash
flutter pub get
```

---

## 5) JWT Configs (for Testing)

Add your JWT configuration in `lib/config.dart` so the app can generate a token for you.
```dart
// lib/config.dart
class Config {
  static const String privateKeyPem = """Your Private Key"""; // <-- add private key here (Don't commit your private key)
  static const String publicKey = """Your Public Key"""; // <-- add public key here
  static const String issuer = ""; // <-- add issuer here
  static const String username = ""; // <-- add username here
  static const String merchantId = ""; // <-- add merchant ID here
  static const String host = "kernelserver.go.dev.haloplus.io";
  static const String aud = ""; // <-- add your audience key
  static const String ksk = ""; // <-- add your ksk
}
```

Under `lib/jwt_token.dart` update the jwt expression as show below

```dart
// lib/jwt_token.dart
 final jwt = JWT(
      {'aud_fingerprints': Config.aud, 'ksk_pin': Config.ksk, 'usr': Config.username},
      audience: Audience([Config.host]),
      issuer: Config.issuer,
      subject: Config.merchantId,
    );
```

---

## 6) Run the App

Use the Flutter CLI or your IDE:

```bash
flutter run
```

Select a connected Android device or emulator when prompted.

---

## 7) Verify the Integration

* App builds and launches without errors.
* Halo SDK features exposed by the plugin are reachable in the test app UI.
* Network calls (if applicable) succeed with your credentials/JWT.

---

## Troubleshooting

* **Java version errors:** Ensure `JAVA_HOME` points to JDK 17.
* **Flutter/Dart mismatches:** Use the tested versions (Flutter 3.24.0, Dart 3.5.0).
* **Dependency resolution issues:** Re-run `flutter pub get` and `flutter clean && flutter pub get`.
* **Credential problems:** Confirm `android/local.properties` contains `aws.accesskey` and `aws.secretkey` and that values are valid in the target environment.
* **JWT failures:** Check token validity/expiration and the correctness of your `config.dart` or `jwt_token.dart` entries.

---

## Notes

* This test app is intended as a reference implementation to demonstrate how to integrate the Halo SDK Flutter plugin into a Flutter app.
* For deeper API usage, configuration options, and platform specifics, consult the SDK README at <a href="https://pub.dev/packages/halo_sdk_flutter_plugin" target="_blank">halo sdk flutter plugin</a>.
