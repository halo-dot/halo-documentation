---
id: cordova-readme
title: Integration Guide for Cordova Plugin
sidebar_class_name: hidden
---

# Halo SDK Cordova Plugin Test App

This is a test app for the Halo SDK Cordova plugin (`HaloPlugin`). It demonstrates how to
use the plugin to integrate the Halo SDK into a Cordova app.

## Getting Started

- The example app was built against `cordova-android@14`, which requires a minimum Android
  SDK 26 and JDK 17+.

1. Clone the repository

2. Open the `test_apps/cordova` directory with your IDE.

3. Run `npm install` in `test_apps/cordova` to install the dependencies and the `HaloPlugin`
   plugin (via its local `file:` reference). `jwt_token.js` signs JWTs locally using the
   WebView's built-in Web Crypto API (`crypto.subtle`), so no extra crypto library is needed.

4. Add the Android platform and restore the plugin:

```bash
npx cordova platform add android
```

5. Add the following to your `test_apps/cordova/platforms/android/local.properties` file
   (these will be provided to you by Synthesis):

```bash
aws.accesskey={{your_access_key}}
aws.secretkey={{your_secret_key}}
```

6. Ideally your server will issue the JWT for you. For testing purposes, copy
   `www/js/config.example.js` to `www/js/config.js` (gitignored) and fill in your values so
   that a JWT is signed locally instead. If you want to use an already issued JWT, add it in
   `www/js/jwt_token.js` as the `tempJwt` variable.

7. Build the debug APK:

```bash
export ANDROID_HOME=/path/to/your/Android/Sdk
npx cordova build android --debug
```

This produces `platforms/android/app/build/outputs/apk/debug/app-debug.apk`.

   If this is the first build on a machine and `cordova build` complains it can't find
   Gradle to bootstrap the wrapper, either open the project once in Android Studio, or put
   any locally-installed `gradle` binary on your `PATH` temporarily - after the first run,
   `platforms/android/gradlew` exists and subsequent builds use it directly.

8. Install and run on a connected device (USB debugging enabled, visible in `adb devices`):

```bash
adb install -r platforms/android/app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n za.co.synthesis.halo.mpos.halocordovaexample/.MainActivity
```

   Or do both the build and the install/run in one step:

```bash
npx cordova run android
```

## Running from Android Studio

You can also build and run using Android Studio's Run button instead of the CLI:

1. Complete steps 1-6 above at least once (`npm install`, `npx cordova platform add android`,
   `local.properties` with your AWS credentials).

2. Open **`test_apps/cordova/platforms/android`** in Android Studio (not `test_apps/cordova`
   itself - `platforms/android` is the actual Gradle project root, since it's the directory
   containing `settings.gradle`).

3. Let Gradle sync, connect your device (or start an emulator) and select it in the device
   dropdown, then press the green **Run** button. This uses the default `app` run
   configuration Android Studio creates automatically for the module.

   `app/src/main/assets/www` is normally only refreshed by the Cordova CLI's `prepare` step
   (part of `cordova build`/`run`), which Android Studio's Run button never calls - so
   without anything else, edits to `www/` would silently be left out of the installed app. A
   `cdvSyncWww` Gradle task (added via `HaloPlugin.gradle`, wired into every build's
   `preBuild`) copies `www/` into the packaged assets automatically, so a plain Android
   Studio Run always reflects your latest JS/HTML/CSS changes.

4. Since `platforms/android` is gitignored and regenerated on a clean rebuild (see
   Troubleshooting below), Android Studio's own project state there (`.idea/`, `*.iml`) is
   ephemeral too - just reopen the folder and let it re-sync after a `platforms/` wipe.

## Troubleshooting

- If you edit `plugins/cordova/HaloPlugin/plugin.xml` and need the change picked up, don't
  use `cordova plugin remove`/`add` - it reproducibly throws a `cordova-common` bug
  (`Cannot read properties of undefined (reading 'id')`) on this project once `edit-config`
  directives are involved. Instead do a clean rebuild:

```bash
rm -rf platforms plugins node_modules
npm install
npx cordova platform add android
```