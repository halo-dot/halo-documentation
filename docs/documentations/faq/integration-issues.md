---
id: integration-issues
title: Integration Issues
---
# Integration Issues

These stem from the SDK integration. <br/>

### Setup Issues

#### Q: Why am I getting a Java version mismatch

  - Upgrade your gradle version in the test app repository to match your Java version.
  - This has been tested with Java 11 and Java 17.
  - You can select which version in Android Studio Settings -> Build, Execution, Deployment -> Build Tools -> Gradle -> Gradle JVM.

#### Q: Why am I getting `Access key cannot be null` or `Secret key cannot be null`

  - Error message: `A build operation failed. Could not resolve all dependencies for configuration ':app:androidApis'.`
  - Add your AWS access key and secret key to the `local.properties` file in the test app repository.
  - The `local.properties` file should be in the root of the test app repository.

#### Q: Am I getting an error with my keys

  - Ensure the correct format of the private key is used in the `Config.kt` file.
```kotlin
   const val PRIVATE_KEY_PEM = "-----BEGIN PRIVATE KEY-----\n" +
           "...\n" +
           "...\n" +
           "...\n" +
           "-----END PRIVATE KEY-----\n"
```

### Running Issues

After embedding the SDK and running the app verify the logCat for any errors, such as

#### Q: Invalid JWT
A: Meaning the JWT is not valid with the public key provided or the private key used to generate the JWT is not the same as the public key provided.

#### Q: Attestation error
A: Meaning the device is not trusted and does not pass the security checks.

#### Q: Required field missing: 'keys'
A: Usually related to a new device accessing old setting. Uninstall and re-install the app.

#### Q: I'm getting attestation failure errors. What does this mean?
A: If you see errors like "Key attestation signature digest doesn't match safetynet signature digest" or "E203: Device has not been attested," this typically means device attestation was accidentally enabled. Contact support to have attestation disabled for your testing environment.
Integration & Connectivity