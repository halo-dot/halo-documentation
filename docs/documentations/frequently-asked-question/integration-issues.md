---
id: integration-issues
title: Integration Issues
---

## SDK Integration & Connectivity Issues

This section addresses common problems encountered during SDK integration and connectivity.

-----

## Setup Issues 🛠️

These issues typically arise during the initial setup of the SDK.

### Java Version Mismatch

**Problem:** You are getting an error related to a Java version mismatch.

**Solution:** Update your Gradle version to match your Java version. The SDK has been tested with **Java 11** and **Java 17**. You can select your Java version in Android Studio by going to **Settings \> Build, Execution, Deployment \> Build Tools \> Gradle \> Gradle JVM**.

### Missing AWS Keys

**Problem:** The error message `A build operation failed. Could not resolve all dependencies for configuration ':app:androidApis'` appears, accompanied by `Access key cannot be null` or `Secret key cannot be null`.

**Solution:** You need to add your **AWS access key** and **secret key** to the `local.properties` file. This file should be located in the **root directory** of your test app repository.

### Incorrect Private Key Format

**Problem:** You are getting an error with your private key.

**Solution:** Ensure the private key in your `Config.kt` file is in the correct PEM format, including the header and footer, as shown below:

```kotlin
   const val PRIVATE_KEY_PEM = "-----BEGIN PRIVATE KEY-----\n" +
           "...\n" +
           "...\n" +
           "...\n" +
           "-----END PRIVATE KEY-----\n"
```

-----

## Runtime Issues 🐛

These issues occur after the SDK is embedded and the app is running. Check the **Logcat** for any of these errors.

### Invalid JWT

**Problem:** The SDK reports an **"Invalid JWT"** error.

**Solution:** This means the JSON Web Token (JWT) is not valid. Verify that the public key provided matches the private key used to generate the JWT. The private key used for generation and the public key provided to the system must be a matching pair.

### Attestation Errors

**Problem:** You receive errors like **"E203: Device has not been attested"** or **"Key attestation signature digest doesn't match safetynet signature digest."**

**Solution:** These errors indicate that **device attestation** was accidentally enabled for your testing environment. This feature performs security checks to ensure the device is trusted. For development and testing, you should contact support to have attestation **disabled**.

### Required Field Missing: 'keys'

**Problem:** The error **"Required field missing: 'keys'"** appears.

**Solution:** This error often occurs when a new device tries to access old settings. The simplest solution is to **uninstall and then reinstall the app**.