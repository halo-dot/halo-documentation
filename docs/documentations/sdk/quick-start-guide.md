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
aws.accessKey={{your_access_key}}
aws.secretKey={{your_secret_key}}
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

You will need to setup the following before using the SDK:

* Generate a JWT
* Request the correct Android permissions
* Initialize the SDK `HaloSDK.initialize()`
* Implement Halo Callbacks, this is used to communicate with the SDK
* Start a transaction `HaloSDK.startTransaction(amount, reference)`

##### JWT Generation.

All calls to the Halo SDK require a valid JWT.<br/>
You will need to generate the JWT using your private key.<br/>
The public key pair is submitted when you register on the <a href="https://go.developerportal.qa.haloplus.io/" target="_blank">Developer Portal</a> and we will validate the JWT with this public key.

The details in the code snippet below will be used in the `IHaloCallbacks.onRequestJWT` method (see below).

```kotlin
object Config {
  const val PRIVATE_KEY_PEM = """{{YOUR_PRIVATE_KEY_PEM}}""".trimIndent()
   // The iss claim that was provided when signing up on the developer portal
   const val ISSUER = "{{YOUR_ISSUER}}"
   const val MID = "{{MID}}"
   const val USERNAME = "{{YOUR_USERNAME}}"
   const val HOST = "{{HOST}}"
   const val AUD = "{{AUD}}"
   const val KSK = "{{KSK}}"
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
      .withSubject(Config.MID)
      .withClaim("aud_fingerprints", Config.AUD)
      .withClaim("ksk_pin", Config.KSK)
      .withClaim("usr", Config.USERNAME)
      .withIssuedAt(Date())
      .withExpiresAt(Date(System.currentTimeMillis() + 15 * 60 * 1000))
      .sign(Algorithm.RSA256(null, privateKey as RSAPrivateKey))
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
@Composable
fun MainScreen(
    // You usually inject this or get from Local
    permissionsController: PermissionsController = rememberPermissionsControllerFactory().create()
) {
    // Very important: binds permission results to the composition
    BindEffect(permissionsController)

    var sdkInitialized by remember { mutableStateOf(false) }
    var permissionRequested by remember { mutableStateOf(false) }

    val permissionLauncher = rememberLauncher(
        permissionsController = permissionsController,
        permissions = listOf(
            Permission.Camera,
            Permission.ReadPhoneState,           // Android only – ignored on iOS
            Permission.ReadExternalStorage,      // maps differently on newer Android / iOS
            Permission.WriteExternalStorage
        )
    )

    LaunchedEffect(Unit) {
        if (permissionLauncher.checkAllGranted()) {
            initializeHaloSdk()
            sdkInitialized = true
        } else if (!permissionRequested) {
            permissionRequested = true
            launch {
                try {
                    permissionLauncher.launch()
                    if (permissionLauncher.checkAllGranted()) {
                        initializeHaloSdk() // <-- this will give you feedback of the sdk lifecycle (see below)
                        sdkInitialized = true
                    } else {
                        // handle denial / show message / degrade gracefully
                    }
                } catch (e: Throwable) {
                    // denied forever or other error
                }
            }
        }
    }

    // Your UI – can depend on sdkInitialized
    if (sdkInitialized) {
        // Full featured UI
        HaloContent()
    } else {
        // Loading / permission request UI
        PermissionRequestScreen()
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
      HaloInitializationParameters( // <-- see below for the interface details
        haloServices,
        60000, // <-- card Tap Timeout in milliseconds
        "za.co.synthesis.halo.halotestapp", // <-- replace with your application name
        "1.0.0" // <-- replace with your application version
      )
    )
  }.start()
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

class HaloCallbacks(private val activity: MainActivity) : IHaloCallbacks() {
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


  override fun onCameraControlLost() {
    Log.d(TAG, "onCameraControlLost")
  }
}
```

##### Start Transaction

```kotlin

private fun startTransaction() {
  val amount = java.math.BigDecimal("500.00")
  val reference = "ref#001"

  val result = HaloSDK.startTransaction(amount, reference)
  // Note: 'result' only reflects the transaction start result. The final transaction
  // outcome will be delivered asynchronously via the onHaloTransactionResult callback.
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
