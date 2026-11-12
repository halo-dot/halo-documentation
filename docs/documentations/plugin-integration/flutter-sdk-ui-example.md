---
sidebar_class_name: hidden
---

# halo_sdk_ui_example

Every call the plugin offers, on one screen, and the whole native integration in
[`MainActivity.kt`](https://github.com/halo-dot/halo_sdk_ui_flutter_plugin/blob/main/example/android/app/src/main/kotlin/za/co/synthesis/halo/halo_sdk_ui_example/MainActivity.kt)
— a base class and one line.

## Running it

You need Halo artifact credentials to resolve `sdk_ui`, in
`android/local.properties`:

```properties
aws.accesskey={{your_access_key}}
aws.secretkey={{your_secret_key}}
```

Then, on an NFC-capable Android device:

```bash
flutter run --dart-define=HALO_JWT=<your Halo SDK token>
```

Without a token the reads still work — the SDK's version, the NFC state, this
device's installation id — and `init` fails, so the buttons that need a live SDK
do nothing. With one, the three charge buttons take a real payment against
whichever kernel that token is issued for.

## The brand file

`android/app/src/main/assets/halo/brand.json` is what the SDK reads its
appearance and addressing from, with every key commented. It is the whole of the
SDK's configuration that does not cross the channel — see **Branding** in the
[plugin's README](https://github.com/halo-dot/halo_sdk_ui_flutter_plugin/blob/main/README.md).

Telemetry is on in that file so a run shows what a host gets. This app ships no
`google-services.json`, so the Firebase provider finds no project and retires
itself; every signal still lands in logcat:

```bash
adb logcat -s HDTelemetry
```
