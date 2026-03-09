# Integration Guide for React Native Plugin

A production-focused guide to integrating the **Halo Dot SDK** via the **halo-sdk-react-native** plugin in a React Native Android application.

> **Scope**: Android-only at present. This guide covers requirements, environment setup, installation, native module configuration, JWT and backend integration, usage patterns, testing, and troubleshooting.

![Halo Dot SDK Architecture](https://static.dev.haloplus.io/static/mpos/readme/assets/full_process_MIPS_1200.png)

---

## Table of Contents

- [Overview](#overview)
- [Requirements](#requirements)
- [Developer Portal Registration](#developer-portal-registration)
  - [Registration Steps](#registration-steps)
- [Getting Started](#getting-started)
  - [Create a React Native App](#create-a-react-native-app)
  - [Environment Setup](#environment-setup)
  - [Plugin Installation](#plugin-installation)
  - [Native Module Setup](#native-module-setup)
  - [AndroidManifest Permissions](#androidmanifest-permissions)
- [Mobile Backend Requirements](#mobile-backend-requirements)
  - [JWT](#jwt)
  - [JWT Lifetime](#jwt-lifetime)
  - [JWT Signing Public Key Format](#jwt-signing-public-key-format)
  - [JWT Claims](#jwt-claims)
- [Usage in Your React Native App](#usage-in-your-react-native-app)
  - [Request Permissions](#request-permissions)
  - [Set Up Callbacks](#set-up-callbacks)
  - [Initialize the SDK](#initialize-the-sdk)
  - [Start a Transaction](#start-a-transaction)
- [Full Example](#full-example)
- [API Reference](#api-reference)
- [Documentation](#documentation)
- [Testing](#testing)
- [FAQ / Troubleshooting](#faq--troubleshooting)

---

## Overview

The **Halo Dot SDK** is an **isolating MPoC SDK** for payment processing with attestation and monitoring capabilities. It turns an NFC-capable Android phone into a card-present payment terminal, no extra hardware required. The architecture diagram above illustrates the SDK boundary, integrator touchpoints, and interactions with the Halo payment gateway.

---

## Requirements

You'll need the following to integrate the Halo Dot SDK:

- A developer account — register on the **<a href="https://go.developerportal.qa.haloplus.io/" target="_blank">Developer Portal</a>**
- Executed **Non-Disclosure Agreement (NDA)** (available on the portal)
- **Public/Private key pair** to generate JWTs (upload the **public** key on the portal)
- **React Native** `0.73+`
- **Java** `21`
- **NFC-capable Android device**
- IDE — **Android Studio** recommended

> **Android SDK levels**
>
> - `minSdkVersion`: **29** or higher
> - `compileSdkVersion`: **34** or higher
> - `targetSdkVersion`: **34** or higher

---

## Developer Portal Registration

You must register on the **QA/UAT** environment before testing in production. The developer portal allows you to:

1. Accept the Non Disclosure Agreement (NDA)
2. Access the SDK
3. Submit your public key (for JWT verification)
4. Obtain JWT configuration details (issuer, audience/host, etc.)
5. Obtain AWS access key and secret key (used to download the SDK)

### Registration Steps

1. Access the **<a href="https://go.developerportal.qa.haloplus.io/" target="_blank">Developer Portal</a>** and register
2. Verify your account via OTP
3. Click **Access to the SDK**

   <img src="https://static.dev.haloplus.io/static/mpos/readme/assets/access_sdk.jpg" width="450" alt="access sdk." />

4. Download and accept the NDA
5. Submit your **public key** and create an **Issuer** name (used to verify your JWT)

   <img src="https://static.dev.haloplus.io/static/mpos/readme/assets/public_key.png" alt="public key." width="450" />

6. Retrieve your **Access key** and **Secret key** — these are used in your IDE to access the Halo SDK (see [Plugin Installation](#plugin-installation))

   <img src="https://static.dev.haloplus.io/static/mpos/readme/assets/access_key.png" alt="access key." width="450" />

---

## Getting Started

### Create a React Native App

If you don't already have a React Native project, create one:

```bash
npx react-native init MyHaloApp
cd MyHaloApp
```

### Environment Setup

1. **Java**: Ensure Java 21 is installed. Run `java -version` to check.
2. **Android minSdk**: Confirm `minSdkVersion` is **29** or higher in `android/app/build.gradle`:

   ```gradle
   android {
       defaultConfig {
           applicationId "com.yourcompany.myapp"
           minSdkVersion 29       // <-- must be 29+
           targetSdkVersion 34
           compileSdkVersion 34
       }
   }
   ```

   > If you encounter issues setting these values, see the [FAQ](#faq--troubleshooting).

### Plugin Installation

1. Install the npm package:

   ```bash
   npm install halo-sdk-react-native
   # or
   yarn add halo-sdk-react-native
   ```

2. **Configure Halo Maven access** (SDK binaries are hosted on AWS S3). Retrieve your `accesskey` and `secretkey` from the **Developer Portal** and add them to `android/local.properties` (create the file if it doesn't exist):

   ```properties
   aws.accesskey=<accesskey>
   aws.secretkey=<secretkey>
   ```

   > **Note**: Keys are case-sensitive. Never commit `local.properties` to source control — add it to your `.gitignore`.

3. Ensure your Gradle script loads `local.properties` (add this to `android/app/build.gradle` if it isn't already there):

   ```gradle
   def localProperties = new Properties()
   def localPropertiesFile = rootProject.file('local.properties')
   if (localPropertiesFile.exists()) {
       localPropertiesFile.withReader('UTF-8') { reader ->
           localProperties.load(reader)
       }
   }
   ```

4. Add the following `packagingOptions` block inside the `android { }` closure in `android/app/build.gradle`. This prevents a duplicate-file error from OSGI metadata bundled in the SDK's transitive dependencies:

   ```gradle
   android {
       // ... your existing config ...

       packagingOptions {
           resources.excludes.add("META-INF/versions/9/OSGI-INF/MANIFEST.MF")
       }
   }
   ```

### Native Module Setup

5. Open `android/app/src/main/kotlin/.../MainActivity.kt` and extend `HaloReactActivity` instead of `ReactActivity`:

   ```kotlin
   import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
   import com.facebook.react.defaults.DefaultReactActivityDelegate
   import za.co.synthesis.halo.sdkreactnativeplugin.HaloReactActivity

   class MainActivity : HaloReactActivity() {

       override fun getMainComponentName(): String = "MyHaloApp"

       override fun createReactActivityDelegate() =
           DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
   }
   ```

   > This replaces `ReactActivity` so that NFC foreground dispatch and the Halo SDK lifecycle are managed automatically.

### AndroidManifest Permissions

6. Add the required permissions to `android/app/src/main/AndroidManifest.xml`:

   ```xml
   <manifest xmlns:android="http://schemas.android.com/apk/res/android"
       xmlns:tools="http://schemas.android.com/tools">

       <uses-feature
           android:name="android.hardware.camera"
           android:required="false" />

       <!-- Bluetooth — legacy permissions for API 29/30 -->
       <uses-permission android:name="android.permission.BLUETOOTH" />
       <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />

       <!-- Bluetooth — API 31+ -->
       <uses-permission android:name="android.permission.BLUETOOTH_SCAN"
           android:usesPermissionFlags="neverForLocation" />
       <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />

       <!-- Location (required for Bluetooth LE scanning) -->
       <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
       <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
       <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />

       <!-- Other -->
       <uses-permission android:name="android.permission.INTERNET" />
       <uses-permission android:name="android.permission.CAMERA" />
       <uses-permission android:name="android.permission.NFC" />

       <uses-feature android:name="android.hardware.nfc" android:required="true" />

       <!--
           tools:replace is required because the Halo SDK (and its bundled Visa library)
           declare android:label and android:allowBackup in their own manifests.
           Without these overrides the manifest merger will refuse to build.
       -->
       <application
           ...
           tools:replace="android:label,android:allowBackup">
           <activity
               android:name=".MainActivity"
               ...>
               <intent-filter>
                   <action android:name="android.intent.action.MAIN" />
                   <category android:name="android.intent.category.LAUNCHER" />
               </intent-filter>

               <!-- Required: NFC foreground dispatch -->
               <intent-filter>
                   <action android:name="android.nfc.action.TECH_DISCOVERED" />
               </intent-filter>
           </activity>
       </application>

   </manifest>
   ```

---

## Mobile Backend Requirements

### JWT

All calls to the Halo SDK require a **valid JWT**. The SDK requests one via the `onRequestJWT` callback whenever it needs to authenticate. The values needed to build the JWT (issuer, audience/host, etc.) are available in the **Developer Portal** (see [Registration Steps](#registration-steps)). We recommend using <a href="https://www.npmjs.com/package/jsrsasign" target="_blank">jsrsasign</a> to generate JWTs.

Install the library:

```bash
npm install jsrsasign
npm install --save-dev @types/jsrsasign
```

Create two files: `src/config.ts` (credentials) and `src/jwt/JwtToken.ts` (JWT creation).

**`src/config.ts`**

```ts
export const Config = {
  privateKeyPem: '-----BEGIN RSA PRIVATE KEY-----\n...', // your RSA private key in PEM format
  issuer: '',       // get from the Developer Portal
  username: '',     // get from the Developer Portal
  merchantId: '',   // get from the Developer Portal
  host: 'kernelserver.qa.haloplus.io',
  aud: '',          // aud_fingerprints value — get from the Developer Portal
  ksk: '',          // ksk_pin value — get from the Developer Portal

  // App settings
  applicationPackageName: 'com.yourcompany.myapp',
  applicationVersion: '1.0.0',
  onStartTransactionTimeOut: 300000,
  enableSchemeAnimations: true,
} as const;
```

**`src/jwt/JwtToken.ts`**

```ts
import { KJUR } from 'jsrsasign';
import { Config } from '../config';

const TTL_MS = 15 * 60 * 1000;

let cachedToken: string | null = null;
let expiresAt = 0;

export function getJwt(): string {
  const now = Date.now();
  if (cachedToken && now < expiresAt) {
    return cachedToken;
  }

  const alg = 'RS512';
  const nowSecs = Math.floor(now / 1000);
  const expSecs = nowSecs + 15 * 60;

  const header = JSON.stringify({ alg, typ: 'JWT' });
  const payload = JSON.stringify({
    aud_fingerprints: Config.aud,
    ksk_pin: Config.ksk,
    usr: Config.username,
    aud: Config.host,
    iss: Config.issuer,
    sub: Config.merchantId,
    iat: nowSecs,
    exp: expSecs,
  });

  cachedToken = KJUR.jws.JWS.sign(alg, header, payload, Config.privateKeyPem);
  expiresAt = now + TTL_MS;
  return cachedToken;
}
```

> **Security**
>
> - Do **not** commit the private key to your repo. Use secure configuration (env vars, secret managers).
> - Provide the JWT via the SDK callback `onRequestJWT`.
> - Always use the algorithm (`RS256` or `RS512`) configured for your tenant in the Developer Portal. If mismatched, signature validation will fail.

### JWT Lifetime

Keep JWT lifetimes **short** to minimize risk. A lifetime of **15 minutes** is recommended.

### JWT Signing Public Key Format

Publish the JWT public key as a **certificate** in a text-friendly format (e.g., **Base64-encoded PEM** `.crt`/`.pem`).

### JWT Claims

The JWT must include the following (standard unless noted):

| Field | Type | Notes |
| --- | --- | --- |
| `alg` | String | RSA algorithm used for signing (e.g., **RS256** or **RS512**). Follow the value configured for your environment to maintain non-repudiation. |
| `sub` | String | Payment Processor Merchant-User ID or Application ID. |
| `iss` | String | Unique identifier for the JWT issuer (as configured by Synthesis/Halo). Retrieve from the **Developer Portal**. |
| `aud` | String | URL of the Halo server TLS endpoint (environment-specific, e.g. `kernelserver.qa.haloplus.io`). |
| `usr` | String | Username of the user performing the transaction. |
| `iat` | NumericDate | UTC issuance timestamp. |
| `exp` | NumericDate | UTC expiration timestamp. |
| `aud_fingerprints` | String | CSV of expected SHA-256 fingerprints for the Kernel Server TLS endpoint (supports rotation). |

To validate values, POST to:

```
https://kernelserver.qa.haloplus.io/<sdk-version>/tokens/checkjwt
```

with **Bearer** auth.

---

## Usage in Your React Native App

### Request Permissions

Request Android runtime permissions before initialising the SDK. Android 12+ (API 31+) uses new Bluetooth permission names.

```ts
// src/permissions.ts
import { PermissionsAndroid, Platform } from 'react-native';

export async function requestHaloPermissions(): Promise<void> {
  if (Platform.OS !== 'android') return;

  const sdkVersion =
    typeof Platform.Version === 'number'
      ? Platform.Version
      : parseInt(Platform.Version, 10);

  const permissions: string[] = [
    PermissionsAndroid.PERMISSIONS.CAMERA,
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  ];

  if (sdkVersion >= 31) {
    permissions.push(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    );
  }

  await PermissionsAndroid.requestMultiple(permissions);
}
```

### Set Up Callbacks

The SDK communicates back to your app through an `IHaloCallbacks` object you provide. Each callback corresponds to a different type of event.

```ts
// src/haloCallbacks.ts
import {
  type IHaloCallbacks,
  type HaloAttestationHealthResult,
  type HaloInitializationResult,
  type HaloTransactionResult,
  type HaloUIMessage,
} from 'halo-sdk-react-native';
import { getJwt } from './jwt/JwtToken';

export function buildCallbacks(options: {
  onStatusChange: (msg: string) => void;
  onError: (msg: string) => void;
  onTransactionResult: (result: HaloTransactionResult) => void;
}): IHaloCallbacks {
  return {
    // Called when the SDK finishes starting up.
    // Check resultType === 'Initialized' for successful init.
    onInitializationResult(result: HaloInitializationResult) {
      if (result.resultType === 'Initialized') {
        options.onStatusChange('SDK ready — present a card to pay');
      } else {
        options.onError(`Initialisation failed: ${result.resultType} (${result.errorCode})`);
      }
    },

    // Called when a card tap completes (approved, declined, or error)
    onHaloTransactionResult(result: HaloTransactionResult) {
      options.onTransactionResult(result);
    },

    // Called repeatedly during a transaction to tell you what to show the user
    // e.g. "PRESENT_CARD", "PROCESSING", "APPROVED"
    onHaloUIMessage(message: HaloUIMessage) {
      options.onStatusChange(message.msgID);
    },

    // The SDK asks you for a fresh JWT whenever it needs one
    onRequestJWT(jwtCallback: (jwt: string) => void) {
      try {
        jwtCallback(getJwt());
      } catch (err: any) {
        options.onError(`JWT error: ${err.message}`);
      }
    },

    // Device failed attestation (tampered OS, emulator, etc.)
    onAttestationError(details: HaloAttestationHealthResult) {
      options.onError(`Attestation error: ${details.errorCode}`);
    },

    // A security check failed (e.g. invalid JWT, revoked merchant)
    onSecurityError(errorCode: string) {
      options.onError(`Security error: ${errorCode}`);
    },

    // The SDK released the camera (e.g. card scheme animation finished)
    onCameraControlLost() {
      console.log('Camera released by SDK');
    },
  };
}
```

### Initialize the SDK

Call `HaloSdk.initialize` once, before running any transactions. A good place is in a `useEffect` when your payment screen mounts.

```ts
import { HaloSdk } from 'halo-sdk-react-native';
import { Config } from './config';
import { requestHaloPermissions } from './permissions';
import { buildCallbacks } from './haloCallbacks';

async function setupSdk(
  onStatusChange: (msg: string) => void,
  onError: (msg: string) => void,
  onTransactionResult: (result: any) => void,
): Promise<void> {
  // 1. Request permissions first
  await requestHaloPermissions();

  // 2. Build your callbacks
  const callbacks = buildCallbacks({ onStatusChange, onError, onTransactionResult });

  // 3. Initialise — the SDK will call onInitializationResult when ready
  await HaloSdk.initialize(
    callbacks,
    Config.applicationPackageName,
    Config.applicationVersion,
    Config.onStartTransactionTimeOut,
    Config.enableSchemeAnimations,
  );
}
```

### Start a Transaction

Once the SDK is initialised, you can charge a card:

```ts
// Charge R 10.50
const result = await HaloSdk.startTransaction(10.50, 'ORDER-001', 'ZAR');
console.log(result.resultType); // e.g. "tap_started"

// Refund R 10.50 to the original card
const refund = await HaloSdk.cardRefundTransaction(10.50, 'ORDER-001', 'ZAR');

// Cancel a transaction that is waiting for a tap
await HaloSdk.cancelTransaction();
```

> `startTransaction` and `cardRefundTransaction` resolve immediately once the tap is registered. The final payment outcome arrives through `onHaloTransactionResult`.

---

## Full Example

A minimal but complete payment screen:

```tsx
// App.tsx
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  HaloSdk,
  type HaloTransactionResult,
  type IHaloCallbacks,
} from 'halo-sdk-react-native';
import { getJwt } from './src/jwt/JwtToken';
import { Config } from './src/config';
import { requestHaloPermissions } from './src/permissions';

export default function App() {
  const [amount, setAmount] = useState('');
  const [merchantRef, setMerchantRef] = useState('');
  const [status, setStatus] = useState('Initialising...');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initSdk();
  }, []);

  async function initSdk() {
    await requestHaloPermissions();

    const callbacks: IHaloCallbacks = {
      onInitializationResult(result) {
        setIsReady(result.resultType === 'Initialized');
        setStatus(
          result.resultType === 'Initialized'
            ? 'Ready — enter amount and tap Charge'
            : `Init failed: ${result.resultType} (${result.errorCode})`,
        );
      },
      onHaloTransactionResult(result: HaloTransactionResult) {
        setStatus(`Result: ${result.resultType} ${result.errorCode}`);
      },
      onHaloUIMessage(message) {
        setStatus(message.msgID);
      },
      onRequestJWT(jwtCallback) {
        try {
          jwtCallback(getJwt());
        } catch (e: any) {
          setStatus(`JWT error: ${e.message}`);
        }
      },
      onAttestationError(details) {
        setStatus(`Attestation error: ${details.errorCode}`);
      },
      onSecurityError(errorCode) {
        setStatus(`Security error: ${errorCode}`);
      },
      onCameraControlLost() {},
    };

    HaloSdk.initialize(
      callbacks,
      Config.applicationPackageName,
      Config.applicationVersion,
      Config.onStartTransactionTimeOut,
      Config.enableSchemeAnimations,
    ).catch(e => setStatus(`SDK error: ${e.message}`));
  }

  async function charge() {
    if (!amount || !merchantRef) {
      setStatus('Please enter amount and merchant reference');
      return;
    }
    try {
      const result = await HaloSdk.startTransaction(parseFloat(amount), merchantRef, 'ZAR');
      setStatus(`Tap accepted: ${result.resultType}`);
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    }
  }

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 13, color: '#555', marginBottom: 16 }}>{status}</Text>

      {!isReady ? (
        <ActivityIndicator size="large" />
      ) : (
        <>
          <TextInput
            placeholder="Amount (e.g. 10.50)"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            style={{ borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 8, borderRadius: 4 }}
          />
          <TextInput
            placeholder="Merchant reference (e.g. ORDER-001)"
            value={merchantRef}
            onChangeText={setMerchantRef}
            style={{ borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 16, borderRadius: 4 }}
          />
          <TouchableOpacity
            onPress={charge}
            style={{ backgroundColor: '#1976D2', padding: 14, borderRadius: 8, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Charge</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
```

---

## API Reference

### `HaloSdk.initialize(callbacks, packageName, version, timeout?, animations?)`

Initialises the SDK. Must be called before any transaction methods.

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `callbacks` | `IHaloCallbacks` | — | Your callback handler object |
| `applicationPackageName` | `string` | — | Your app's Android package name |
| `applicationVersion` | `string` | — | Your app's version string |
| `onStartTransactionTimeOut` | `number?` | `300000` | Time in ms to wait for a card tap |
| `enableSchemeAnimations` | `boolean?` | `false` | Show Visa/Mastercard/Amex animations on approval |

### `HaloSdk.startTransaction(amount, reference, currency)`

Starts a purchase transaction. Prompts the user to tap their card.

| Parameter | Type | Example |
| --- | --- | --- |
| `transactionAmount` | `number` | `10.50` |
| `merchantTransactionReference` | `string` | `'ORDER-001'` |
| `transactionCurrency` | `string` | `'ZAR'` |

Returns `Promise<HaloStartTransactionResult>` — resolves when the card tap is registered. The final outcome arrives via `onHaloTransactionResult`.

### `HaloSdk.cardRefundTransaction(amount, reference, currency)`

Starts a card-present refund. Accepts the same parameters as `startTransaction`.

### `HaloSdk.cancelTransaction()`

Cancels the current in-progress transaction (e.g. if the user presses Cancel while waiting for a tap).

### Callbacks (`IHaloCallbacks`)

| Callback | When it fires |
| --- | --- |
| `onInitializationResult(result)` | SDK startup complete (success or failure) |
| `onHaloTransactionResult(result)` | Final payment outcome: approved, declined, or error |
| `onHaloUIMessage(message)` | Prompt to show the user during a tap: `PRESENT_CARD`, `PROCESSING`, `APPROVED`, etc. |
| `onRequestJWT(jwtCallback)` | SDK needs a fresh JWT — call `jwtCallback(yourJwtString)` |
| `onAttestationError(details)` | Device integrity check failed (rooted device, emulator, etc.) |
| `onSecurityError(errorCode)` | JWT invalid, merchant revoked, or other security failure |
| `onCameraControlLost()` | SDK has finished using the camera |

### Result Types

`resultType` and `errorCode` are plain strings serialised from native Android enums.

**`HaloInitializationResult.resultType`**

| Value | Meaning |
| --- | --- |
| `'Initialized'` | SDK ready — safe to call `startTransaction` |
| `'RemoteAttestationFailure'` | Cloud attestation failed; inspect `errorCode` for the reason |
| `'LocalAttestationFailure'` | Device integrity check failed (rooted device, emulator, etc.) |

**`HaloInitializationResult.errorCode`** (when `resultType !== 'Initialized'`)

| Value | Meaning |
| --- | --- |
| `'OK'` | No error — accompanies `resultType: 'Initialized'` |
| `'JWTExpired'` | The JWT has expired — generate a fresh one |

**`HaloTransactionResult.resultType`**

| Value | Meaning |
| --- | --- |
| `'Approved'` | Transaction approved by the payment network |
| `'Declined'` | Card declined |
| `'Cancelled'` | Transaction cancelled (e.g. via `cancelTransaction()`) |
| `'Error'` | An error occurred — inspect `errorCode` and `errorDetails` |

---

## Documentation

- **<a href="/docs/documentations/sdk/getting-started-with-sdk" target="_blank">Halo Dot SDK Docs</a>**

---

## Testing

- All transactions are **null and void** until the **NDA** is executed.
- You can test with a virtual card, e.g., **<a href="https://apkpure.com/visa-mobile-cdet/com.visa.app.cdet" target="_blank">Visa Mobile CDET</a>**.

---

## FAQ / Troubleshooting

**Q: How do I set `compileSdkVersion` / `minSdkVersion` if they're causing issues?**

Define them in `android/local.properties` and read them from Gradle:

```properties
sdk.dir=C\:\\Users\\yourname\\AppData\\Local\\Android\\Sdk
aws.accesskey=YOUR_ACCESS_KEY
aws.secretkey=YOUR_SECRET_KEY
compileSdkVersion=34
minSdkVersion=29
```

```gradle
// android/app/build.gradle
compileSdkVersion localProperties.getProperty('compileSdkVersion').toInteger()
defaultConfig {
    minSdkVersion localProperties.getProperty('minSdkVersion').toInteger()
}
```

**Q: The SDK fails to download / Gradle sync fails.**

- Confirm `aws.accesskey` and `aws.secretkey` are in `android/local.properties` with the exact casing shown
- Open the `android` folder in Android Studio and run **File → Sync Project with Gradle Files**
- Ensure you have accepted the NDA on the developer portal (access is blocked until the NDA is signed)

**Q: I get a build error about `HaloReactActivity` or `HaloSdkPackage` not found.**

- Confirm the npm package is installed: `npm install halo-sdk-react-native`
- Confirm `MainActivity` extends `HaloReactActivity` (not `ReactActivity`)
- Run a Gradle sync in Android Studio

**Q: The SDK initialises but transactions never complete.**

- Check that all `AndroidManifest` permissions are declared, especially the NFC `intent-filter` block
- Check that the NFC `intent-filter` is inside the `<activity>` block for `MainActivity`
- Verify your JWT is valid using `POST https://kernelserver.qa.haloplus.io/<sdk-version>/tokens/checkjwt`
- Check that `minSdkVersion` ≥ 29 and `compileSdkVersion` / `targetSdkVersion` ≥ 34

**Q: How do I get a JWT for testing?**

A JWT must be generated using your RSA private key and the credentials from the developer portal. See the [JWT Claims](#jwt-claims) section for required fields and the [JWT](#jwt) section for the recommended `jsrsasign` setup.

**Q: Manifest merger fails with an attribute conflict (e.g. `android:label`, `android:allowBackup`).**

The Halo SDK bundles several sub-libraries (Visa Sensory Branding, etc.), each with their own `AndroidManifest.xml`. Fix this by adding the conflicting attribute name to `tools:replace` on your `<application>` element:

```xml
<application
    ...
    tools:replace="android:label,android:allowBackup">
```

If the error persists, run a clean build:

```bash
cd android && ./gradlew clean
```

Then re-run your normal build (`npx react-native run-android` or Android Studio).

**Q: TypeScript build errors about `customConditions` or `moduleResolution` after editing `tsconfig.json`.**

Do not override `moduleResolution` in your project's `tsconfig.json`. Instead, extend the base config and only add project-specific overrides:

```json
{
  "extends": "@react-native/typescript-config/tsconfig.json",
  "compilerOptions": {
    "skipLibCheck": true
  }
}
```

`skipLibCheck: true` suppresses type errors originating inside `node_modules` without affecting how your own code is compiled.

**Q: `onInitializationResult` fires with `resultType: 'RemoteAttestationFailure'` and `errorCode: 'JWTExpired'`.**

Your temp JWT has expired. Developer-portal tokens are short-lived (typically 15 minutes). The SDK fires a failure callback with the expired token, then automatically requests a new JWT via `onRequestJWT` and retries. If `onInitializationResult` fires a second time shortly after with `resultType: 'Initialized'`, everything is working correctly.

If the second successful callback never arrives:

- Generate a fresh token and update `Config.tempJwt`
- Make sure your `onRequestJWT` callback calls `jwtCallback(yourJwt)` synchronously — async calls are not supported without extra handling

---
