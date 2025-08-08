# SDK Mobile Integration Guide

This README provides technical guidance on the integration of the Halo.SDK with a host Android application.&#x20;

| The Halo Dot SDK is an Isolating MPoC SDK payment processing MPOC Software with Attestation & Monitoring Capabilities.                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <p>The Architecture of this isolating MPoC Payment Software, is described in the diagram below.</p><p></p><p>The below diagram also showcases the SDK boundary and the interaction between the SDK its integrating channels, and the 3rd party payment gateway. It also describes the boundary of the SDK and how it interacts with integrators and the third party payments. It also includes details of how the data is communicated sent in-between the boundary.  </p> |

<figure><img src="/img/SDKBoundry.png" alt="" /><figcaption><p>SDK Boundry</p></figcaption></figure>

<figure><img src="/img/halodot-backend.png" alt="" /><figcaption>Halo Backend</figcaption></figure>

The Halo.SDK is an isolated system development kit with A\&M functionality. It operates in an isolated memory space, which provides sufficient separation of data processing between the SDK and other software (including the integrating app).

## 1. Remote Attestation of Application by Halo Server

In accordance with prescribed security requirements, the Halo server performs remote attestation of the application using the Google Play Integrity attestation framework.

**APK Values Required by Halo Server for Remote Attestation**

The following attestation payload field must be configured in the Halo server with each release so that they can be checked by the server during remote attestation.

| field                      | description                                                                  |
| -------------------------- | ---------------------------------------------------------------------------- |
| apkPackageName             | fully qualified APK name, e.g. za.co.synthesis.halo.halo\_mpos\_new          |
| apkCertificateDigestSha256 | base64 encoded, SHA-256 hash of the certifi cate used to sign requesting app |
| applicationVersion         | version number of application of host application                            |


## 2. Requirements on the Mobile Back-End

**JWT**

All calls were made to the Halo.SDK requires a valid JWT. The mobile application server is expected to supply the mobile app with a JWT that can be used to authenticate with the Halo Kernel Server. The SDK requires a callback function, `onRequestJWT(callback: (String) -> Unit)`, that it will use whenever a JWT is required.

An asymmetric key is used so that the JWT can be issued (signed) by one system (mobile application server), and independently verified by another (Halo server).

**JWT LifeTime**

Since the JWT essentially authorizes payment acceptance for a given merchant user, it is essential that the JWT lifetime be kept as short as possible, in order to limit the amount of time an attacker has to crack the key itself and then to limit the scope of damage in the event of a key compromise.

A lifetime of 15 minutes is recommended.

**JWT Signing Public Key Format**

The JWT public key should be published as a certificate, in a text-friendly format, e.g. B64 encoded PEM (.crt, .pem).

**JWT Serialization Format**

The compact serialization format is expected, i.e:

```
urlencodedB64(header) + '.' + urlencodedB64(payload) + '.' + urlencodedB64(signature)
```

For example:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2dnZWRJbkFzIjoiYWRtaW4iLCJpYXQiOjE0MjI3Nzk2Mzh9.gzSraSYS8EXBxLN_oWnFSRgCzcmJmMjLiuyu5CSpyH
```

**JWT Claims**

The JWT must make a number of claims - all of them standard except for aud\_fingerprints (Audience Fingerprints):

|       field       |     type    | Note                                                                                                                                                                                                                                                                                                                                                      |
| :---------------: | :---------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|        alg        |    String   | The signing algorithm is RSA signed SHA-256 hash, aliased as RS256. An asymmetric encryption(signing) scheme is required to allow the Kernel Server to be able to validate the token without being able to generate it. If symmetric key encryption was used to sign the auth token (e.g., using the HMAC algorithm), then non-repudiation would be lost. |
|        sub        |    String   | The Payment Processor Merchant-User ID, or Application ID                                                                                                                                                                                                                                                                                                 |
|        iss        |    String   | This is a unique (from the perspective of Halo server) identifier for the JWT issuer, agreed upon by the JWT issuer and Synthesis, and configured in advance by Synthesis in the Halo server, e.g. authserver.haloplus.io                                                                                                                                 |
|        aud        |    String   | URL of Halo server TLS endpoint, e.g. 'kernelserver.qa.haloplus.io'. This value should be obtained from Synthesis (different per environment) e.g. for QA it would be 'kernelserver.qa.haloplus.io' and for DEV 'kernelserver.za.dev.haloplus.io'                                                                                                         |
|        usr        |    String   | The details of the user performing the transaction, typically the username used to sign into the Integrators application.                                                                                                                                                                                                                                 |
|        iat        | NumericDate | The UTC timestamp of when the JWT was generated.                                                                                                                                                                                                                                                                                                          |
|        exp        | NumericDate | The UTC time of expiration of the JWT.                                                                                                                                                                                                                                                                                                                    |
| aud\_fingerprints |    String   | a CSV list of expected SHA-256 fingerprints for the Kernel Server TLS endpoint. This list may contain multiple values to support certificate rotation. In the QA environment, the expected value as of writting this would be: "sha256/zc6c97JhKPZUa+rIrVqjknDE1lDcDK77G41sDo+1ay0="                                                                      |

**If using the Halo Dot Adaptor, the following additional fields are required**

These are only supported from SDK version 4.0.2.

       field       |     type    | Note                                                                                                                                                                                                                                                                                                                                                      |
| :---------------: | :---------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| x-am-endpoint| String | URL of Halo A&M endpoint, e.g. 'kernelserver.qa.haloplus.io'. |
| x-am-endpoint-fingerprints | String | a CSV list of expected SHA-256 fingerprints for the A&M endpoint. This list may contain multiple values to support certificate rotation. In the QA environment, the expected value as of writting this would be: "sha256/zc6c97JhKPZUa+rIrVqjknDE1lDcDK77G41sDo+1ay0=" |

All these values can be validated by making a POST request to "https://kernelserver.qa.haloplus.io/tokens/checkjwt". Your JWT should be added as header (Bearer Auth).

## 3. SDK Binary

HaloSDK is written in Kotlin and packaged as an AAR (Android Archive Library). For security reasons, the compiled binary has been obfuscated.

See the [Getting Started Guide](/docs/documentations/sdk/getting-started-with-sdk) for a detailed guide on accessing and getting started with the SDK.

## 4. Application Manifest

The `AndroidManifest.xml` application manifest file of the mobile application must include the following user permissions:

* `android.permission.INTERNET` - call out to the backend over the internet
* `android.permission.NFC`- use the NFC module

In addition, in order to indicate to the Play store that this is an NFC-enabled app, the `android.hardware.nfc` the feature needs to be specifi ed, with `required=false` . If required is set to true then the mobile app itself will not be allowed to be installed on devices that don't support NFC, which is presumed to not be the desired behavior.

**Android Gradle Plugin > 3.4.2**

Due to a limitation with the TEE library that is used, if the Android Gradle Plugin (`classpath 'com.android.tools.build:gradle'`) is greater than 3.4.2, the following attribute needs to be added to the application element inside the Android Manifest application

```
android:extractNativeLibs="true"
```

## 5. Life-Cycle Methods

In order for the SDK to properly handle the Android application life cycle, the host app needs to add hooks into the following Android lifecycle methods on the `MAIN activity`.

:warning: **do not hook up to a SUB activity or a fragment** as this will cause problems

List of Android lifecycle methods:

* `onCreate(Bundle savedInstanceState)`
* `onStart()`
* `onResume()`
* `onPause()`
* `onStop()`
* `onSaveInstanceState(Bundle outState, PersistableBundle outPersistentState)`
* `onSaveInstanceState(Bundle outState)`
* `onDestroy()`

Halo.SDK has corresponding static methods with matching method signatures for each of the Android lifecycle methods.

This can all be wired up as follows:

```
public class MainActivity extends AppCompatActivity {
    @Override
    public void onCreate(Bundle savedInstanceState, PersistableBundle persistentState) {
        super.onCreate(savedInstanceState, persistentState);
        // your mobile app code here
        HaloSDK.onCreate(this , this, savedInstanceState, persistentState);
    }

    @Override
    protected void onStart() {
        super.onStart();
        // your mobile app code here
        HaloSDK.onStart();
    }

    @Override
    protected void onResume() {
        super.onResume();
        // your mobile app code here
        HaloSDK.onResume();
    }

    @Override
    protected void onPause() {
        super.onPause();
        // your mobile app code here
        HaloSDK.onPause();
    }

    @Override
    protected void onStop() {
        super.onStop();
        // your mobile app code here
        HaloSDK.onStop();
    }

    @Override
    public void onSaveInstanceState(@NonNull Bundle outState, @NonNull PersistableBundle outPersistentState) {
        super.onSaveInstanceState(outState, outPersistentState);
        // your mobile app code here
        HaloSDK.onSaveInstanceState(outState, outPersistentState);
    }

    @Override
    protected void onSaveInstanceState(@NonNull Bundle outState) {
        super.onSaveInstanceState(outState);
        // your mobile app code here
        HaloSDK.onSaveInstanceState(outState);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        // your mobile app code here
        HaloSDK.onDestroy();
    }
}
```

## 6. Initialization of the SDK

Separate from the lifecycle hooks, the SDK must be initialized before transacting by calling the static `initialize` method on the SDK, passing it a `HaloInitializationParameters` object.

The SDK will attempt to perform the following sequence of actions:

* the Perform runtime checks (the device is not rooted, running in debug mode, or under instrumentation)
* Confirm that the software (Android version) and hardware platform (NFC device) is sufficient
* Connect to the server, passing on the JWT for verification
* Confirm that the device has been enrolled, and is not blocked - re-enrolling if necessary
* Perform device-local Google Play Integrity key attestation actions, and submit results to the server for remote verification
* Retrieve terminal configuration from the server
* Initialize the SDK to a state where it will accept transactions

The result will be communicated, typically asynchronously (depending on exactly what happens and when), to the host application via invoking the callback registered in `IHaloCallbacks.onInitializationResult` and passing a `HaloInitializationResult`.

The `HaloInitializationResult.resultType` field indicates whether or not the initialization was successful or not. A value `Initialized` indicates success, all other values indicate some kind of failure.

In the case of failure, the `errorCode` field may hold more information, whereas in the case of success, the SDK is now ready to accept a transaction.

**HaloInitializationParameters**

```
import za.co.synthesis.halo.sdk.model.HaloInitializationParameters

public class HaloInitializationParameters {
    public IHaloCallbacks haloCallBacks;
    public Long cardTimeTimeoutMS;
    public String applicationName;
    public String applicationVersion;
}
```

`Long cardTimeTimeoutMS` - Timeout value, in milliseconds, that the SDK will wait for a card tap after startTransaction has been called, before returning with a timeout error.

`String applicationName` - The fully qualified package name of the calling application.

`String applicationVersion` - The version number of the calling application.

`IHaloCallbacks haloCallBacks` - See below discussion on the `IHaloCallbacks` interface.

**IHaloCallbacks**

```
import za.co.synthesis.halo.sdk.model.IHaloCallbacks

public interface IHaloCallbacks {
    void onInitializationResult(HaloInitializationResult result);
    void onHaloUIMessage(HaloUIMessage message);
    void onHaloTransactionResult(HaloTransactionResult result);
    void onRequestJWT(Function1<? super String, Unit> function1);
    void onAttestationError(HaloAttesationHealthResult result);
    void onCameraControlLost();
}
```

The `IHaloCallbacks` interface encapsulates the call-back methods that the HaloSDK will use to asynchronously communicate back to the host application at relevant junctures:

1. The outcome of the initialization process (`onInitializationResult`)
2. Interim transaction progress (`onHaloUIMessage`)
3. Final outcome of a transaction (`onHaloTransactionResult`)
4. Issues with intermittent attestation checks (`onAttestationError`)

**HaloInitializationResult**

```
import za.co.synthesis.halo.sdk.model.HaloInitializationResult

public class HaloInitializationResult {
    public HaloInitializationResultType resultType;
    public Currency terminalCurrency;
    public List<String> terminalLanguageCodes;
    public String terminalCountryCode;
    public String message;
}
```

Notes on `HaloInitializationResult`:

1.  `HaloInitializationResultType`

    Here is a list of possible values for `HaloInitializationResultType`

    | Value                             | Meaning                                                        |
    | --------------------------------- | -------------------------------------------------------------- |
    | Initialized                       | Success                                                        |
    | AuthenticationError               | Error occurred during authentication                           |
    | NetworkError                      | Network socket error during connection to server               |
    | UnsupportedOperatingSystemVersion | Android OS too low                                             |
    | RootedDevice                      | Device rooting detected                                        |
    | InstrumentedDevice                | Runtime instrumentation detected                               |
    | DebuggedDevice                    | Debug mode detected                                            |
    | GeneralError                      | General failure                                                |
    | RemoteAttestationFailure          | Device failed remote leg of Android Play Integrity attestation |
    | NFCDisabledError                  | NFC either absent, turned off, or NFC permission not granted   |
2.  Terminal Localisation Information Returned in `HaloInitializationResult`

    As part of initialization, the SDK will fetch its pre-defined terminal configuration from the Halo server - and this includes localization data which should be checked by the host application to ensure that the terminal is transacting in the expected currency, which is required for the limit checks done as part of kernel processing to be performed in the correct matching currency. In addition, these values should be used to determine the correct currency symbol and a number of decimal points to use when displaying the transaction amount to the cardholder.
3.  `terminalLanguageCodes`

    The EMV terminal specification dictates that the terminal be configured with a list of language preferences (ISO 639-1 alpha2 language code), ordered from highest to lowest priority. The mobile app should ideally use this list to determine which language to use for display purposes.
4.  `terminalCurrency`

    The terminal has a single supported currency. This is the currency in which card risk limits are configured, and the transaction must be conducted. It is also the currency that must be used when displaying amounts. The mobile app should determine the correct currency symbol and a number of decimal places from this. If this value is not as expected, then the mobile app should not allow transactions.
5.  `terminalCountryCode`

    The terminal is configured with a country code that indicates the domestic country. The returned value is formatted as an ISO 3166-1 numeric 3 country code left padded with zeros to length 4, e.g. 0710 = South Africa.

## 7. Transaction Flow

This section describes the Transaction flow of the SDK in more detail.

**HaloSDK.startTransaction**

Once the SDK has been successfully initialized, as indicated by a `HaloInitializationResultType` of `Success`, a transaction may be initiated by calling `HaloSDK.startTransaction`.

```
public final fun startTransaction(
    transactionAmount: java.math.BigDecimal,
    merchantTransactionReference: kotlin.String
): za.co.synthesis.halo.sdk.model.HaloStartTransactionResult
```

Let's take a closer look at `startTransaction` parameters:

* `transactionAmount` - The purchase amount, stated in the `terminalCurrency` as returned in `HaloInitializationResult.terminalCurrency`.
* `merchantTransactionReference` - It is recommended to use a random GUID for this purpose.

The `merchantTransactionReference` is a unique-per-merchant transaction reference generated and supplied by the mobile application. Halo will generate and maintain its own internal ID for the transaction (`haloTransactionReference`), but from the perspective of the mobile application `merchantTransactionReference` together with the value `Payment Processor Merchant-User ID` specified in the JWT `sub` field can be used to uniquely identify a merchant transaction.

This value needs to be unique per merchant transaction, i.e. different merchants could use the same `merchantTransactionReference` for two different transactions, but the value would need to be unique per transaction for a given merchant. In the event that the same `merchantTransactionReference` is supplied for two different transactions for the same merchant, the second transaction will be rejected by the Halo server, and the final transaction result type returned for the second transaction will be `HaloTransactionResultType.DuplicateMerchantTransactionReferenceSupplied`.

In the event of the final transaction result type being `HaloTransactionResultType.Indeterminate` , then it is the `merchantTransactionReference` that should be used to look up and potentially resolve the final transaction outcome - potentially through a manual reversal by the merchant via the web portal.

The return type of `startTransaction` is `HaloStartTransactionResult` and is defined as:

```
import za.co.synthesis.halo.sdk.model.HaloTransactionResult
    public class HaloStartTransactionResult {
        public HaloStartTransactionResultType resultType;
        public String message;
    }
```

where `HaloStartTransactionResultType` is:

```
import za.co.synthesis.halo.sdk.model.HaloTransactionResultType
    public enum HaloStartTransactionResultType {
        Started,
        NotInitialized,
        GeneralError,
        NFCDisabledError;
    }
```

**Start Transaction Flow**

As part of starting a transaction, the SDK will check:

* NFC is present and turned on
* SDK itself has been successfully initialized
* Platform runtime (root/debug/instrumentation)

`HaloSDK.startTransaction` will always synchronously return a `HaloStartTransactionResultType`, only a value of `Started` indicates that the SDK is satisfied to actually start a new transaction, all other values indicate a failure of some kind.

In the event of a failure, the return of the `startTransaction` method signals the end of the transaction and Halo.SDK will invoke no further callbacks, and this outcome should be regarded as the final outcome of this transaction, and full control returns to the mobile application.

If the SDK is able to start the transaction, `startTransaction` will return a `HaloStartTransactionResultType` of `Started`.

From this point onwards, Halo.SDK will communicate interim transaction progress back to the mobile application by means of invoking the `IHaloCallback.onHaloUIMessage`callback function, and the final transaction outcome by invoking the `IHaloCallback.onHaloTransactionResult`.

**Informing the Merchant of a Tamper Event**

If `HaloSDK.startTransaction` returns a result type of `RootedDevice`, `InstrumentedDevice` or `DebuggedDevice`, then the EMV specification dictates that it is mandatory for the host application to immediately inform the merchant on screen that their device has been tampered with.

**Communication of Interim Status**

Before the final transaction outcome is communicated via `IHaloCallbacks.onHaloTransactionResult`, interim transaction progress will typically be communicated to the mobile app via invoking `IHaloCallbacks.onHaloUIMessage`:

```
void onHaloUIMessage(HaloUIMessage message);
```

It is expected that the mobile app will use these message events as triggers for communicating interim transaction status information or action prompts such as present card, remove card, present card again to the card holder.

Let's have a closer look at `HaloUIMessage`:

```
import za.co.synthesis.halo.sdk.model.HaloUIMessage

public class HaloUIMessage {
    public HaloUIMessageID msgID;
    public int holdTimeMS;
    public List<String> languagePreference;
    public HaloCurrencyValue offlineBalance;
    public HaloCurrencyValue transactionAmount;
}
```

And the parameters of `HaloUIMessage`:

1.  `HaloUIMessageID msgID`

    The `msgID` field indicates the interim transaction status, which should be communicated to the user. The following are the types that `msgID` can be:

    | Enum                                  | Text                                       | Description                                                                                |
    | ------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------ |
    | PresentCard                           | Present Card                               | Initial message, accompanied by transaction amount                                         |
    | Processing                            | Processing...                              | May occur between `PresentCard` and `CardReadOK_RemoveCard`                                |
    | CardReadOK\_RemoveCard                | Card Read OK, Remove Card                  | Card reading has been completed and user should remove card                                |
    | SeePhoneForInstructions\_ThenTapAgain | See Phone for Instructions, then Tap Again | Authorise transaction on payment device, then tap again                                    |
    | AuthorisingWait                       | Authorising, Please Wait...                | Attempting online authorization                                                            |
    | TryAgain                              | Try Again                                  | Initial card read failed, cardholder to present card again - transaction still in progress |
    | TryAnotherCard                        | Try Another Card                           | Transaction failed, start a new transaction with a different card                          |
2.  `int holdTimeMS`

    The EMV terminal specification dictates that when multiple messages are received in quick succession for the same transaction, each message must be displayed for a minimum amount of time (the message hold time), before proceeeding to display the next message. This is intended to allow the user enough time to read eachmessage, and typically results in queue-based implementations.

    holdTimeMS refl ect the message hold time, in units of milliseconds.
3.  `List languagePreference` The EMV specification dictates that cards may include a list of language preferences. If the card does contain such a list, it will be specified in `HaloUIMessage` as `languagePreference`, which is a list of ISO 639-1 alpha2 language codes, in order of language.

    The mobile application can then choose to display the UI message texts in a preferred language, or if not specifi ed, in its default language.

**IHaloCallbacks.onHaloTransactionResult**

Once it has completed processing, Halo.SDK communicates the final transaction outcome to the mobile application via invoking the `IHaloCallbacks.onHaloTransactionResult` callback, and passing it a `HaloTransactionResult` object. Once the mobile application receives a `HaloTransactionResult`, it can regard the transaction as concluded, and assume full control again.

Here is a closer look at `HaloTransactionResult`:

```
public class HaloTransactionResult {
    public HaloTransactionResultType resultType;
    public String merchantTransactionReference;
    public String haloTransactionReference;
    public String paymentProviderReference;
    public String message;
    public HaloTransactionReceipt receipt;
    public Map<String, String> customTags;
}
```

And the parameters of `HaloTransactionResult`:

1.  `HaloTransactionResultType resultType`

    The `HaloTransactionResultType resultType` field indicates the final transaction status to the host application.

    | Value                                         | Description                                                                                                               |
    | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
    | Approved                                      | Transaction successfully approved online                                                                                  |
    | Declined                                      | Transaction declined, either offl ine by terminal or card, or onliny by issuer                                            |
    | CardTapTimeOutExpired                         | Timed out waiting for a card tap                                                                                          |
    | NetworkError                                  | Network socket communication error                                                                                        |
    | ProcessingError                               | An error occurred during EMV card processing                                                                              |
    | Cancelled                                     | Transaction called by host application                                                                                    |
    | TryAnotherCard                                | Transaction failed with this card, but may succeeed with another card                                                     |
    | NFCDisabledError                              | NFC on the device is turned off                                                                                           |
    | NotAuthenticated                              | Invalid JWT token provided                                                                                                |
    | Indeterminate                                 | Unknown transaction status, inform merchant to manually query transaction status via merchant portal before giving goods  |
    | DuplicateMerchantTransactionReferenceSupplied | Transaction rejected by server due to use of duplicate merchant transaction reference. attempt again with a new reference |
    | HealthError                                   | An error occurred while checking the status of the Kernel Server                                                          |
    | InvalidJWT                                    | An error occurred while parsing the JWT                                                                                   |

    Only if a `HaloTransactionResultType` of `Approved` is received should the merchant be instructed that the transaction has been successful. If a result of type `Indeterminate` is returned, then the merchant **MUST** be instructed to query the Payment Processor as to the final transaction outcome - **BEFORE** giving goods/services. This will typically be done either through the host application itself, or via the payment processor's merchant management portal. All other values should be regarded as conclusively indicating that the transaction has failed.
2.  Transaction References

    | Reference                    | Source                                                  |
    | ---------------------------- | ------------------------------------------------------- |
    | merchantTransactionReference | `HaloSDK.startTransaction.merchantTransactionReference` |
    | haloTransactionReference     | Halo server                                             |
    | paymentProviderReference     | Payment Provider                                        |
3.  HaloTransactionReceipt

    EMV receipt information is specified in `HaloTransactionResult.receipt`. Approved transactions will always contain receipt information, whereas this is not guaranteed in the case of declined transactions.

    | Field                    | Description                                                                          |
    | ------------------------ | ------------------------------------------------------------------------------------ |
    | transactionDate          | Transaction Date, YYMMDD                                                             |
    | transactionTime          | Transaction Time, HHMMSS                                                             |
    | aid                      | Application ID, 16 hex chars                                                         |
    | applicationLabel         | Application Label, 16 chars                                                          |
    | applicationPreferredName | Application Preferred Name, 16 chars                                                 |
    | tvr                      | Terminal Verification Results, 10 hex chars                                          |
    | cvr                      | Card Verification Results, hex                                                       |
    | cryptogramType           | Application Cryptogram type: AAC, TC, ARQC                                           |
    | cryptogram               | Application Cryptogram, 16 hex chars                                                 |
    | maskedPAN                | Card PAN masked according to PCI, 16 chars                                           |
    | authorizationCode        | The final authorization code returned by the issuer in the online response, 12 chars |
    | ISOResponseCode          | Authorisation Response Code returned by the issuer in the online response            |
    | association              | Card scheme: MasterCard, Visa, AMEX                                                  |
    | expiryDate               | Card application expiry date                                                         |

## 8. SDK Async Behaviour after startTransaction Returns

Assuming that `startTransaction` returns a synchronous result type of `Started` , the SDK will continue with async transaction processing.

**Pre-Processing**

The SDK will first perform transaction pre-processing as per the EMV specification. The transaction can be declined during pre-processing (typically due to terminal limits). In this case, the SDK will communicate this by calling `IHaloCallbacks.onHaloTransactionResult` with `HaloTransactionResult.resultType` as `Declined`, then terminate, sending no UI messages.

**Enablement of NFC Field**

Assuming that pre-processing succeeds, the SDK will attempt to turn the NFC field on. If it is not able to do so (typically because NFC has not been enabled within phone settings), then the SDK will abandon the transaction, and return `HaloTransactionResult.resultType` as `NFCDisabledError`.

**Confirmation of Transaction Amount**

Assuming that the NFC field could be enabled, the SDK will then send a `PresentCard` `HaloUIMessageID`, with the transaction amount specified in the `transactionAmount` field. No action is required by the user to confirm the amount, the message is displayed only for information purposes.

**Wait for Tap or Timeout**

At this point, the SDK will wait for either a tag to be tapped, or for the card tap timeout to expire. If the timeout occurs, then the SDK will abandon the transaction,and return `HaloTransactionResult.resultType` as `CardTapTimeOutExpired`.

**On Tap**

Assuming the card is tapped in time, the SDK will engage with the card. At this point, 1 of 2 things can happen:

1. A processing error occurs during the card interaction. `HaloTransactionResult.resultType` of `ProcessingError` is returned, and the SDK abandons transaction.
2. The card interaction completes successfully. In this case, the SDK will send a `CardReadOK_RemoveCard` UI message, and continue with async transaction processing.

**Potential for Offline Decline**

Under some situations, the attempted online transaction may be declined offline by the card, in this case, the SDK will return a `HaloTransactionResult.resultType` of `Declined`, and abandon the transaction.

**PIN**

If the transaction amount exceeds the CVM limit and the card supports online PIN, the SDK will request a PIN for the transaction. This is handled transparently by the SDK using a Trusted User Interface, which will briefly assume control of the mobile device screen to capture a PIN.

Once the PIN has been captured, control will return to the calling application.

**Online Processing**

Assuming that the card interaction was successful, no processing errors were encountered, and that the card did not decline the transaction outright, then the SDK will attempt to prepare, submit and process an online transaction authorization request.

The SDK will send a `OnlineProcessing` UI message to indicate that is begun online processing.

**General Error During Online Processing**

If there is a general error during the preparation of the online request, the SDK will return a `HaloTransactionResult.resultType` of `ProcessingError`, and abandon the transaction.

**Could Not go Online**

If the SDK is unable to submit the online authorization request due to network connectivity issues, it will return a `HaloTransactionResult.resultType` of `NetworkError`, and abandon the transaction.

**Ambiguous Transaction Outcome**

In the event that the SDK was able to connect and submit an online authorization request, but did not receive a response, it will return a `HaloTransactionResult.resultType` of `Indeterminate`, and abandon the transaction.

In this case, the user must be instructed to consult the transaction back-end in order to determine the final transaction outcome before handing over the goods/services.

**Final Transaction Outcome**

Once the SDK has received and processed the online response, it will communicate the fi nal transaction outcome, which at this point should be one of `Approved`, `Declined` or `NotAuthenticated`. A result of `NotAuthenticated` typically means that the JWT supplied has expired, and that the transaction should be restarted with a fresh JWT. The SDK will then terminate.

**Try Another Card**

In some cases the SDK will determine that the transaction cannot be completed with the current card/device, in this case it will return a `TryAnotherCard` result, and the mobile app should instruct the user to attempt the transaction with a different card. From the perspective of the SDK, this will be a new transaction.

**Try Again Flow**

In some unusual cases, the SDK will require the user to present the same card/device again, in order to complete the transaction. In these cases, the SDK will retain control, but will require the mobile application to communicate instructions to the user via ui messages during the transaction. These instructions will either be to tap the same card/device again ( `TryAgain` ), or to first consult their device for instructions, then tap the device again ( `SeePhoneForInstructions_ThenTapAgain` ). It is only when the transaction has been finally concluded that the SDK will communicate a final transaction result as per normal, then terminate.

## 9. Integrating the Halo SDK in a Multi-Activity Kotlin Android App

### Overview

This integration demonstrates how to structure a Halo SDK payment flow within an Android app that uses multiple Activity classes. The implementation covers:

- SDK initialization in an Application class
- Permission management and activity lifecycle callbacks in the Parent Activity
- Launching a payment flow via an Intent
- Handling callbacks and results in a custom IHaloCallbacks implementation
- Displaying transaction results in a dedicated success screen


### Initialization and Application Context

The MyApplication class initializes the Halo SDK once per app session using the initializeHaloSdk() method.

```
class MyApplication: Application() {

    var haloCallbacks: HaloCallbacks? = null
    var isInitialized = false

    fun initializeHaloSdk(activity: Activity) {
        HaloSDK.onCreate(this, activity)
        if (isInitialized) {
            return
        }

        Thread {
            val timer = Timer()
            haloCallbacks = HaloCallbacks(this, activity, timer) {}
            timer.start()
            HaloSDK.initialize(
                HaloInitializationParameters(
                    haloCallbacks,
                    60000,
                    applicationInfo.packageName,
                    BuildConfig.VERSION_NAME,
                )
            )
        }.start()
    }
}
```
An Application class is used so that the initialization state as well as the callbacks can be shared across all activities. The SDK is initialized in a separate thread to avoid blocking the UI thread.
This function, initializeHaloSdk(), should be called in your parent activity - where the payment methods are shown i.e. 

```
// Initialize Halo SDK
if (requestNecessaryPermissions()) {
        val app = application as MyApplication
        app.initializeHaloSdk(this)
}
```

### Permissions and Entry Point: Parent Activity

The Parent Activity, in this case MainActivity, requests camera and Bluetooth permissions. On success, it initializes the Halo SDK and provides a button to trigger a transaction.

```
val intent = Intent(this, PayActivity::class.java).apply {
    putExtra("transactionId", "sometransactionId")
    putExtra("transactionAmount", "100")
}
startActivity(intent)
```

### Starting a Transaction

On navigation to the PayActivity, the following occurs:
1. UI elements like amount are updated.
2. HaloSDK.onCreate() is called again with this new Activity context.
3. HaloSDK.startTransaction() is called with the amount and transaction ID passed via Intent.

This isolates transaction logic in a focused screen, simplifying UX flow.

### Handling Callbacks: IHaloCallbacks

HaloCallbacks extends IHaloCallbacks and contains detailed logic for:

- Initialization: Verifies result, logs errors, and triggers onInitializationSuccess.
- Transaction Results: Parses and displays transaction results.
- JWT: Uses JwtToken to sign and pass a JWT using RSA keys.
- Health and security monitoring: Handles attestation and verification events.

```
override fun onHaloTransactionResult(result: HaloTransactionResult) {
    val intent = Intent(activity, TransactionSuccess::class.java).apply {
        putExtra("TRANSACTION_ID", result.merchantTransactionReference)
        putExtra("CARD_NUMBER", result.receipt?.maskedPAN.toString())
        ...
    }
    activity.startActivity(intent)
    PayActivity.currentInstance?.get()?.finish()
}
```
Route to an activity to display a receipt for your user.

For the full source code, visit: https://github.com/halo-dot/test_app-android_sdk

## 10. Conclusion

That concludes the guide to integrate the Halo.SDK into your application. For any questions, please do not hesitate to reach out to the Halo Dot Team.

Not what you were looking for? If you are looking for the Intent Integration guide, it is over [here](/docs/documentations/sdk/halo-system-baseline)
