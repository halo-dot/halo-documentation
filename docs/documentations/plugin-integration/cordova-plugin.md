---
id: cordova-plugin
title: Integration Guide for Cordova Plugin
sidebar_position: 3
---

# Integration Guide for Cordova Plugin Release

A production-focused guide to integrating the **Halo Dot SDK** via the <a href="https://www.npmjs.com/package/halo-cordova-plugin" target="_blank">HaloPlugin Cordova plugin</a> in a Cordova Android application.

> **Scope**: Android-only at present. This guide covers requirements, environment setup, installation, native module configuration, JWT and backend integration, usage patterns, testing, and troubleshooting.
---

## Table of Contents

- [Integration Guide for Cordova Plugin Release](#integration-guide-for-cordova-plugin-release)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Requirements](#requirements)
  - [Developer Portal Registration](#developer-portal-registration)
    - [Registration Steps](#registration-steps)
  - [Getting Started](#getting-started)
    - [Plugin Installation](#plugin-installation)
    - [Setup the Project.](#setup-the-project)
  - [Mobile Backend Requirements](#mobile-backend-requirements)
    - [JWT Generation.](#jwt-generation)
  - [Usage in Your Cordova App](#usage-in-your-cordova-app)
    - [Android Permissions (Optional)](#android-permissions-optional)
    - [Requesting Runtime Permissions (Optional)](#requesting-runtime-permissions-optional)
  - [How to Initialize Halo SDK](#how-to-initialize-halo-sdk)
    - [Initialize Callbacks](#initialize-callbacks)
      - [onRequestJWT](#onrequestjwt)
      - [onHaloUIMessage](#onhalouimessage)
      - [onInitializationResult](#oninitializationresult)
      - [onHaloTransactionResult](#onhalotransactionresult)
      - [onAttestationError](#onattestationerror)
      - [onSecurityError](#onsecurityerror)
    - [Initialize Halo SDK](#initialize-halo-sdk)
    - [Start a Transaction](#start-a-transaction)
  - [Build the debug APK:](#build-the-debug-apk)
      - [Install and run on a connected device](#install-and-run-on-a-connected-device)
  - [Running from Android Studio](#running-from-android-studio)
  - [Troubleshooting](#troubleshooting)
    - [Updating Local Plugin Configurations (`HaloPlugin`)](#updating-local-plugin-configurations-haloplugin)
      - [Recommended Fix: Fast Platform Rebuild](#recommended-fix-fast-platform-rebuild)
- [1. Remove cached native build files and local plugin links](#1-remove-cached-native-build-files-and-local-plugin-links)
- [2. Re-add the Android platform (re-links local plugins from config.xml)](#2-re-add-the-android-platform-re-links-local-plugins-from-configxml)

## Overview

The <a href="https://docs.halodot.io/docs/documentations/sdk/sdk-integration-guide" target="_blank">**Halo Dot SDK**</a> is an **isolating MPoC SDK** for payment processing with attestation and monitoring capabilities. The architecture diagram below illustrates the SDK boundary, integrator touchpoints, and interactions with third‑party payment gateways.

![Halo Dot SDK Architecture](https://static.dev.haloplus.io/static/mpos/readme/assets/full_process_MIPS_1200.png)

## Requirements

You’ll need the following to integrate the Halo Dot SDK:

- A developer account — register on the **<a href="https://go.developerportal.qa.haloplus.io/" target="_blank">Developer Portal</a>**
- Executed **Non‑Disclosure Agreement (NDA)** (available on the portal)
- **Public/Private key pair** to generate JWTs (upload the **public** key on the portal)
- **Access key** and **Secret key** (obtainable from the Developer Portal after NDA acceptance and public key upload)
- **Nodejs** `20.10.0` or higher
- **npm:xml2ls**: `npm install xml2js`
- **Java** `21`
  - Environment variables `JAVA_HOME`, `ANDROID_HOME` set up correctly
- **Cordova** `10.0.0` or higher
- **Android SDK levels**:
    - `minSdkVersion`: **29** or higher
    - `compileSdkVersion`: **34** or higher
    - `targetSdkVersion`: **34** or higher
- **NFC-capable Android device**
- IDE — **Android Studio** recommended

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

1. Install the Apache Cordova CLI globally on your system
  
```node
npm install -g cordova
```

2. Generate a new Cordova project
Syntax: cordova create "directory_name" "package_identifier" "app_title"

```node
npx cordova create MyCordovaApp com.example.mycordovaapp "My Cordova App"
```

3. Navigate into the newly created project folder

```node
cd MyCordovaApp
```

4. Add platform targets to the project
 'browser' allows rapid testing without needing Android Studio or Xcode

```node
npx cordova platform add browser
```

5. Add Android target (Requires Android SDK)

```node
npx cordova platform add android
```

6. Test run the application in your local browser

```node
npx cordova run browser
```

### Plugin Installation

1. Add the plugin to your project:

```bash
npx cordova plugin add halo-cordova-plugin
```

2. **Configure Halo Maven access** (SDK binaries are hosted on AWS S3). <br/>
   Retrieve your `accesskey` and `secretkey` from the **<a href="https://go.developerportal.qa.haloplus.io/" target="_blank">Developer Portal</a>** and add them to `android/local.properties` 
   
   (create the file if it doesn’t exist):

```bash
aws.accesskey=<accesskey>
aws.secretkey=<secretkey>
```
> **Note**: Keys are case‑sensitive. Keep them out of source control.

3. Perform a gradle sync in Android Studio or `cordova prepare android`
4. You should now have access to the 'za.co.synthesis.halo.sdk' namespace
5. Be sure that your application has camera, microphone and location permissions before using the plugin.
6. To ensure that the Pin Screen works, add the following tag to the Application Layer/Tag of your AndroidManifest.xml file: 
   
```bash
android:theme="@style/Theme.AppCompat.Light.NoActionBar.FullScreen"
```

7. Your server will issue the JWT for you.

### Setup the Project.

The default project template created by Cordova includes a `config.xml` file.<br/>
You will need to modify the following in the `config.xml` file:

**Key Updates**

1. Root `<widget>` tag update: Add `xmlns:tools="http://schemas.android.com/tools"` so Cordova can apply Android Manifest Merger rules.

2. Android platform block: Add `<platform name="android">` to group all Android-specific configurations.

3. Minimum SDK setting: Add `<preference name="android-minSdkVersion" value="29" />` to satisfy the Halo SDK requirements.

4. Manifest Modification: Add an <edit-config> block targeting app/src/main/AndroidManifest.xml to inject tools:replace="android:label". This ensures your app's name takes priority over the Halo SDK's SoftPos label during compilation.

```xml
<?xml version='1.0' encoding='utf-8'?>
<widget id="io.halodot.app" 
        version="1.0.0" 
        xmlns="http://www.w3.org/ns/widgets" 
        xmlns:cdv="http://cordova.apache.org/ns/1.0"
        xmlns:tools="http://schemas.android.com/tools">
    
    <name>Test Halo SDK</name>
    <description>
        A sample Apache Cordova application that responds to the deviceready event.
    </description>
    <author email="dev@cordova.apache.org" href="https://cordova.apache.org">
        Apache Cordova Team
    </author>
    <content src="index.html" />
    <allow-intent href="http://*/*" />
    <allow-intent href="https://*/*" />

    <!-- Android Platform Configuration -->
    <platform name="android">
        <!-- Force minimum Android SDK to API 29 (Android 10) for Halo SDK -->
        <preference name="android-minSdkVersion" value="29" />

        <!-- 1. Explicitly bind the tools namespace to the AndroidManifest.xml root tag -->
        <edit-config file="app/src/main/AndroidManifest.xml" mode="merge" target="/manifest">
            <manifest xmlns:tools="http://schemas.android.com/tools" />
        </edit-config>

        <!-- 2. Resolve Manifest Merger conflict for application label -->
        <edit-config file="app/src/main/AndroidManifest.xml" mode="merge" target="/manifest/application">
            <application tools:replace="android:label" />
        </edit-config>
    </platform>

</widget>
```

## Mobile Backend Requirements

### JWT Generation.

All calls to the Halo SDK require a valid JWT. 

To keep your private key secure, JWTs **must not** be generated directly on the mobile device. Instead, your app should request a signed JWT from your backend server.

Refer to the **[JWT Integration Guide](/docs/documentations/sdk/jwt)** for step-by-step instructions on setting up your backend service, generating RSA key pairs, and implementing the server-side authentication endpoint in your preferred language.

## Usage in Your Cordova App

### Android Permissions (Optional)

Declare required permissions in `AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="za.co.synthesis.halo.sdkcordovaplugin_example">

    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.NFC"/>
    <uses-permission android:name="android.permission.CAMERA"/>

    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />

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

### Requesting Runtime Permissions (Optional)

The plugin will request for necessary permission but you can pre-emptively request for permissions using the `permission_handler` package.

```bash
cordova plugin add cordova-plugin-android-permissions
```

```javascript
/**
 * Requests required runtime permissions for Camera, Location, Bluetooth (Scan & Connect), and NFC.
 * @returns {Promise<boolean>} Resolves to true if permissions were granted.
 */
function requestAppPermissions() {
    return new Promise((resolve, reject) => {
        // Ensure Cordova device is ready and plugin exists
        if (!window.cordova || !cordova.plugins || !cordova.plugins.permissions) {
            return reject(new Error("cordova-plugin-android-permissions is not available."));
        }

        const permissions = cordova.plugins.permissions;

        // List of permission constants to request
        const permissionsList = [
            permissions.CAMERA,
            permissions.ACCESS_FINE_LOCATION,
            permissions.ACCESS_COARSE_LOCATION,
            permissions.BLUETOOTH_SCAN,
            permissions.BLUETOOTH_CONNECT,
            permissions.NFC
        ];

        // Helper function to request the array of permissions
        function requestPermissionsArray() {
            permissions.requestPermissions(
                permissionsList,
                (status) => {
                    if (status.hasPermission) {
                        console.log("All requested permissions granted.");
                        resolve(true);
                    } else {
                        console.warn("One or more permissions were denied by the user.");
                        resolve(false);
                    }
                },
                (err) => {
                    console.error("Error requesting permissions:", err);
                    reject(err);
                }
            );
        }

        // Check if permissions are already granted
        permissions.hasPermission(
            permissionsList,
            (status) => {
                if (status.hasPermission) {
                    console.log("Permissions are already granted.");
                    resolve(true);
                } else {
                    // If not granted, trigger request dialog
                    requestPermissionsArray();
                }
            },
            (err) => {
                console.warn("Failed checking permission status, proceeding to request:", err);
                requestPermissionsArray();
            }
        );
    });
}
```

Ensure `compileSdkVersion` and `targetSdkVersion` are **34** or higher. 

## How to Initialize Halo SDK

Before using any Halo SDK features, you must initialize the SDK by providing the application name, version and card tap timeout.

### Initialize Callbacks

The Halo Cordova plugin uses a callback-based approach to communicate with the native SDK. You must register callbacks to receive notifications about the SDK's status, events, and transaction results.

When the device initiates, we will need to register a number of callbacks to ensure that the app and the SDK can communicate effectively. The callbacks are: 
* `onRequestJWT` : This callback is used to request a JWT from the backend server. 
* `onHaloUIMessage` : This callback is used to receive messages from the SDK. 
* `onInitializationResult` : This callback is used to receive the result of the SDK initialization.
* `onHaloTransactionResult` : This callback is used to receive the result of a transaction.
* `onAttestationError` : This callback is used to receive error messages from the SDK.
* `onSecurityError` : This callback is used to receive security error messages from the SDK.

```js
document.addEventListener('deviceready', onDeviceReady, false);

async function onDeviceReady() {
    console.info("Ready - tap Initialize")
    await window.plugins.haloPlugin.registerCallbacks(
        onRequestJWT,
        onHaloUIMessage,
        onInitializationResult,
        onHaloTransactionResult,
        onAttestationError,
        onSecurityError
    );
    console.log("Finished awaiting")
}
```

#### onRequestJWT

The `onRequestJWT` callback is invoked when the SDK requires a valid JWT to proceed with an operation (e.g., initialization, transaction, or card tap). Your app must request a fresh JWT from your backend server and return it to the SDK.

```javascript
// This is an example request to the backend server call to get a JWT

async function onRequestJWT(callback) {
  var jwt = await fetch("https://your-backend.com/0.0.36/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "your-username",
      password: "your-password"
    })
  }).then(function(response) {
    return response.json();
  }).then(function(data) {
    return data.token;
  });
  callback(jwt);
}
```

#### onHaloUIMessage

The `onHaloUIMessage` callback These messages are used to update the UI of the app.

```javascript
// This is an example

function onHaloUIMessage(haloUIMessage) {
  const msgID = haloUIMessage?.msgID ?? JSON.stringify(haloUIMessage)
  document.getElementById("status").innerHTML = msgID
}
```

#### onInitializationResult

The `onInitializationResult` callback is invoked when the SDK is initialized.

```javascript
function onInitializationResult(haloInitialisationResult) {
  console.log(`[INIT RESULT] ${JSON.stringify(haloInitialisationResult)}`)
  
  if (haloInitialisationResult?.errorCode === "OK") {
    document.getElementById("status").innerHTML = `Initialized (${haloInitialisationResult.resultType}) - ready to Transact`
  } else {
    document.getElementById("status").innerHTML = `Init failed: ${haloInitialisationResult?.errorCode ?? haloInitialisationResult?.resultType}`
  }
}
```

#### onHaloTransactionResult

This is called when a transaction is completed.

```javascript
function onHaloTransactionResult(haloTransactionResult) {
  console.clear()
  console.log(`[TRANSACTION RESULT] ${JSON.stringify(haloTransactionResult)}`)
  document.getElementById("status").innerHTML = `Transaction: ${haloTransactionResult?.resultType ?? haloTransactionResult?.errorCode}`
  document.getElementById("uiMessageID").textContent = ""
}
```

#### onAttestationError

This is called when there is an error in the SDK.

```javascript
function onAttestationError(haloAttestationError) {
  console.error(`[ATTESTATION ERROR] ${JSON.stringify(haloAttestationError)}`)
}
```

#### onSecurityError

This is called when there is a security error in the SDK.

```javascript
function onSecurityError(haloSecurityError) {
  console.error(`[SECURITY ERROR] ${JSON.stringify(haloSecurityError)}`)
}
```

### Initialize Halo SDK

Call the `initialize` method on the Halo SDK plugin to initialize the SDK. You must provide an options object that contains the application name, application version, and card tap timeout. You must also provide callback functions to receive notifications about the SDK's status, events, and transaction results.

```js
function initializeButtonPressed() {
  var options = {
    cardTapTimeout: "20000",
    applicationName: "com.app.hf",
    applicationVersion: "1.0.0"
  }
  console.log("Initializing...")
  window.plugins.haloPlugin.initialize(onSuccessfulInitialization, onFailedInitialization, options);
}

function onSuccessfulInitialization(result) {
  console.log("[INITIALIZE] request accepted")
  console.log(`Initialization request accepted: ${result}`)
  if (result === "requestingNewJWT"){
    await refreshJWT("initialise");
  } else if (result.resultType === "Token refreshed successfully!") {
    initializeButtonPressed();
  } else if (result.code){
    console.info(String(result.code));
  } else {
    console.info(String(result.resultType));
  }
}

function onFailedInitialization(error) {
  console.log(`Initialize failed: ${String(error)}`)
}
```

### Start a Transaction

Call the `startTransaction` method on the Halo SDK plugin to start a transaction. You must provide an options object that contains the transaction amount, transaction reference, and transaction currency. You must also provide callback functions to receive notifications about the SDK's status, events, and transaction results.

```js
function startTransaction() {
  var transactionValue = document.getElementById("amountField").value;
  var merchantReference = document.getElementById("merchantReferenceField").value;
  //TODO: Add validation here
  window.plugins.haloPlugin.startTransaction(
    async function(result) {
      console.log(`[START TRANSACTION RESULT] ${JSON.stringify(result)}`)
      if (result === "requestingNewJWT") {
        alert("Fetching new JWT token");
      } else if (result.resultType === "Started"){
        setStatus("Transaction started - tap your card now")
      } else if (result.resultType) {
        alert(String(result.resultType));
      } else if (result.code) {
        alert(String(result.code));
      } else {
        alert(String(result.msgID));
      }
    },
    function(result) {
      alert(String(result.resultType));
    },
    {
      transactionValue,
      merchantReference,
      currency: 'ZAR'
    }
  );
}
```

## Build the debug APK:

```bash
export ANDROID_HOME=/path/to/your/Android/Sdk
npx cordova build android --debug
```

This produces `platforms/android/app/build/outputs/apk/debug/app-debug.apk`.

   If this is the first build on a machine and `cordova build` complains it can't find
   Gradle to bootstrap the wrapper, either open the project once in Android Studio, or put
   any locally-installed `gradle` binary on your `PATH` temporarily - after the first run,
   `platforms/android/gradlew` exists and subsequent builds use it directly.

#### Install and run on a connected device 

Enable USB debugging and ensure your device is visible in `adb devices`:

```bash
npx cordova run android
```

   Or do both the build and the install/run in one step:

```bash
adb install -r platforms/android/app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n za.co.synthesis.halo.mpos.halocordovaexample/.MainActivity
```


## Running from Android Studio

You can also build and run using Android Studio's Run button instead of the CLI:

1. Complete all steps above at least once (`npm install`, `npx cordova platform add android`,
   `local.properties` with your AWS credentials).

2. Open **`cordova/platforms/android`** in Android Studio (not `cordova` itself 
   - `platforms/android` is the actual Gradle project root, since it's the directory 
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

### Updating Local Plugin Configurations (`HaloPlugin`)

> ⚠️ **Important:** Do **not** use `cordova plugin remove` or `cordova plugin add` when modifying `plugins/cordova/HaloPlugin/plugin.xml`.
>
> **Known CLI Bug:** Due to an issue in `cordova-common`, modifying plugins that contain `<edit-config>` directives via the CLI triggers the following error:
> ```text
> TypeError: Cannot read properties of undefined (reading 'id')
> ```

#### Recommended Fix: Fast Platform Rebuild
To apply `plugin.xml` changes without waiting for a full `npm install`:

```bash
# 1. Remove cached native build files and local plugin links
rm -rf platforms plugins

# 2. Re-add the Android platform (re-links local plugins from config.xml)
npx cordova platform add android