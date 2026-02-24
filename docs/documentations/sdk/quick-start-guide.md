---
id: quick-start-guide
title: Quick Start guide
sidebar_class_name: hidden
sidebar_display: none
tags:
  - sdk
  - guides
---

The SDK is hosted in a maven repo, through an S3 bucket in a Halo AWS account.

A debug version of the SDK is made available to support development efforts, but only the release version will be permitted to transact in production. <br/>
The debug version has full logging enabled and allows a debugger to be attached to the integrating app.

#### Accessing Maven Repo

1. In order to access the SDK, we generate an AWS access key and secret key when you register on the developer portal here.<br/>
   These are sensitive and should not be committed to source control.<br/>
   Add the credentials to the *local.properties* file located in your android app source.

Open the *local.properties* file and insert _aws.accessKey_ and *aws.secretKey* with their values. <br/>
These credentials are sensitive and should not be committed to source control. Your local.properties should look like this:

```properties
sdk.dir=~/Library/Android/sdk
aws.accessKey=your_access_key
aws.secretKey=your_secret_key
```

2. Add the following to your project-level gradle file (build.gradle). <br/>
This will read the value of the access credentials inside *local.properties*  into variables:


```kotlin
ext {
    Properties properties = new Properties()
    def propertiesFile = project.rootProject.file('local.properties')
    if (propertiesFile.exists()) {
        properties.load(propertiesFile.newDataInputStream())
    }

    def localAccessKey = properties.getProperty('aws.accesskey')
    def systemEnvAccessKey = System.getenv('AWS_ACCESS_KEY_ID')

    def localSecretKey = properties.getProperty('aws.secretkey')
    def systemEnvSecretKey = System.getenv('AWS_SECRET_ACCESS_KEY')

    accessKey = localAccessKey != null ? localAccessKey : systemEnvAccessKey
    secretKey = localSecretKey != null ? localSecretKey : systemEnvSecretKey
}
```

3. Add the following to your module-level gradle file to pull the artifacts:

You need to add two repos:

* Snapshots: Debug builds
* Release: Release builds

```kotlin
repositories {
    def repos = [
            'releases',
            'snapshots'
    ]

    repos.each { repo ->
        maven {
            name = repo
            url = "s3://synthesis-halo-artifacts/$repo"
            credentials(AwsCredentials) {
                accessKey = rootProject.ext.accessKey
                secretKey = rootProject.ext.secretKey
            }
        }
    }
}

dependencies {
    releaseImplementation group: "za.co.synthesis.halo", name: "sdk", version: "4.0.8"
    debugImplementation group: "za.co.synthesis.halo", name: "sdk", version: "4.0.8-debug"
}
```

After a gradle sync, you should now be able to import from the za.co.synthesis.halo.sdk namespace, e.g:

```kotlin
import za.co.synthesis.halo.sdk.HaloSDK
```

#### Using the SDK

##### JWT Generation.

All calls to the Halo SDK require a valid JWT.<br/>
Your app will need to generate the JWT with the private key and we will validate it against the public key you have submitted.

You will need the following information, most are provided on the <a href="https://go.developerportal.qa.haloplus.io/" target="_blank">Developer Portal</a>

The details here in the code snippet here will be used in the `IHaloCallbacks.onRequestJWT` method (see below).

```kotlin
object Config {
   const val PRIVATE_KEY_PEM = "-----BEGIN PRIVATE KEY-----\n" +
           "MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCog7ygGDWjZibl\n" +
           "..." +
           "..." +
           "..." +
           "-----END PRIVATE KEY-----\n"

   // The iss claim that was provided when signing up on the developer portal
   const val ISSUER = "YOUR_ISSUER_HERE"
   const val MERCHANT_ID = "YOUR_MERCHANT_ID_HERE"
   const val USERNAME = "YOUR_USERNAME"
   const val HOST = "kernelserver.go.dev.haloplus.io"
   const val AUD = "sha256/njzWuJWBZoQz5FsWiic9uCXrLkNL+qObPavkJqfwhYc="
   const val KSK = "sha256/1Zna4T6PKcJ3Kq/dbVylb8n62j/AdQYUzWrj/4sk5Q8="
}

class JwtToken {
  fun getJWT(callback: (String) -> Unit) {
    // Generate Private Key
    val privateKey = KeyFactory.getInstance("RSA").generatePrivate(
        PKCS8EncodedKeySpec(Base64.decode(extractPrivateKey(Config.PRIVATE_KEY_PEM), Base64.DEFAULT))
    )

    // Create JWT token
    val jwt = JWT
      .create()
      .withAudience(Config.HOST)
      .withIssuer(Config.ISSUER)
      .withSubject(Config.MERCHANT_ID)
      .withClaim("aud_fingerprints", Config.AUD)
      .withClaim("ksk_pin", Config.KSK)
      .withClaim("usr", Config.USERNAME)
      .withIssuedAt(Date())
      .sign(Algorithm.RSA512(null, privateKey as RSAPrivateKey))
    callback(jwt)
  }

  private fun extractPrivateKey(privateKey: String): String {
    val beginMarker = "-----BEGIN PRIVATE KEY-----"
    val endMarker = "-----END PRIVATE KEY-----"

    val startIndex = privateKey.indexOf(beginMarker)
    val endIndex = privateKey.indexOf(endMarker)

    return if (startIndex != -1 && endIndex != -1) {
        privateKey.substring(startIndex + beginMarker.length, endIndex).trim()
    } else {
        privateKey
    }
  }
}
```

##### Permission requirements.

Before initialization of the HaloSDK, the app must request the following permissions from the user:

* `android.permission.INTERNET`
* `android.permission.ACCESS_NETWORK_STATE`
* `android.permission.CAMERA`
* `android.permission.READ_PHONE_STATE`
* `android.permission.READ_EXTERNAL_STORAGE`
* `android.permission.WRITE_EXTERNAL_STORAGE`

```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
  super.onCreate(savedInstanceState)
  setContentView(R.layout.activity_main)
  if (requestNecessaryPermissions()) {
    initializeHaloSdk()
  }
  initializeUI()
}

private fun requestNecessaryPermissions(): Boolean {
  val permissions = arrayOf(
    Manifest.permission.CAMERA,
    Manifest.permission.READ_PHONE_STATE,
    Manifest.permission.READ_EXTERNAL_STORAGE,
    Manifest.permission.WRITE_EXTERNAL_STORAGE
  )

  val missing = permissions.filter {
    ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
  }

  return if (missing.isEmpty()) {
    true 
  } else {
    permissionLauncher.launch(missing.toTypedArray())
    false
  }
}
```

##### Initialize the SDK

The Halo.SDK must be initialized before any transaction by calling the static initialize method on the SDK and passing a `HaloInitializationParameters` instance as an argument. 

```kotlin
import za.co.synthesis.halo.sdk.HaloSDK
import za.co.synthesis.halo.sdk.model.HaloInitializationParameters

private fun initializeHaloSdk() {
  HaloSDK.onCreate(this, activity)
  if (isInitialized) {
      return
  }
  Thread {
    val haloServices = HaloCallbacks(this, timer) // <-- this will give you feedback of the sdk lifecycle (see below)
    HaloSDK.initialize(
      HaloInitializationParameters(
        haloServices,
        60000,
        BuildConfig.APPLICATION_ID,
        BuildConfig.VERSION_NAME
      )
    )
  }
}
```

**HaloInitializationParameters**

```kotlin
import za.co.synthesis.halo.sdk.model.HaloInitializationParameters

public class HaloInitializationParameters {
    public IHaloCallbacks haloCallBacks;
    public Long cardTimeTimeoutMS;
    public String applicationName;
    public String applicationVersion;
}
```

The result will be communicated, typically asynchronously, to the host application via invoking the callback registered in `IHaloCallbacks.onInitializationResult` and passing a `HaloInitializationResult` instance.

##### Implement Halo Callbacks

**IHaloCallbacks**

```kotlin
import za.co.synthesis.halo.sdk.model.IHaloCallbacks

public interface IHaloCallbacks {
    void onInitializationResult(HaloInitializationResult result);
    void onHaloUIMessage(HaloUIMessage message);
    void onHaloTransactionResult(HaloTransactionResult result);
    void onRequestJWT(Function1<? super String, Unit> function1);
    void onAttestationError(HaloAttestationHealthResult result);
    void onSecurityError(HaloErrorCode code);
    void onCameraControlLost();
}

class HaloCallbacks(private val activity: MainActivity, private val timer: Timer) : IHaloCallbacks() {
  override fun onAttestationError(details: HaloAttestationHealthResult) {
    Log.d(TAG, "onAttestationError - $details")
  }

  override fun onHaloTransactionResult(result: HaloTransactionResult) {
    Log.d(TAG, "onHaloTransactionResult - $result")
  }

  override fun onHaloUIMessage(message: HaloUIMessage) {
    Log.d(TAG, "onHaloUIMessage - $message")
  }

  override fun onInitializationResult(result: HaloInitializationResult) {
    Log.d(TAG, "onInitializationResult - $result")
  }

  override fun onRequestJWT(callback: (String) -> Unit) {
    JwtToken().getJWT(callback)
  }

  override fun onSecurityError(errorCode: HaloErrorCode) {
      Log.d(TAG, "onSecurityError - $errorCode; should crash now")
  }

  override fun onGetVerificationToken(result: HaloVerificationTokenResult) {
      Log.d(TAG, "onGetVerificationToken")
  }

  override fun onCameraControlLost() {
    Log.d(TAG, "onCameraControlLost")
  }
}
```

#### Start Transaction

```kotlin

private fun startTransaction() {

  val amount = 500
  val reference = "ref#001"

  val result = HaloSDK.startTransaction(amount, reference)
  Log.d(TAG, result.toString())
}
```

**HaloInitializationResult**

```kotlin
import za.co.synthesis.halo.sdk.model.HaloInitializationResult

public class HaloInitializationResult {
    public HaloInitializationResultType resultType;
    public Currency terminalCurrency;
    public List<String> terminalLanguageCodes;
    public String terminalCountryCode;
    public String message;
}
```

##### For a more technical integration guide:

* How to [initialize the SDK](/docs/documentations/sdk/sdk-integration-guide#6-initialization-of-the-sdk).
* How to [start a transaction](/docs/documentations/sdk/sdk-integration-guide#7-transaction-flow).
* See the [life cycle of the SDK](/docs/documentations/sdk/sdk-integration-guide#5-life-cycle-methods).
* See the [next guide](/docs/documentations/sdk/sdk-integration-guide) for further information.
