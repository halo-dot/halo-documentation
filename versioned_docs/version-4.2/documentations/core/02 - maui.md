---
description: >-
  Turn your .NET MAUI app into a secure Tap on Phone payment terminal with
  Halo.Core.
---

# Halo.Core for .NET MAUI

Halo.Core brings Halo Dot's SoftPOS technology straight into your own Android app. Add one package and one line of setup, and your app can take contactless card payments on the phone in your merchant's hand. No extra hardware needed.

The `HaloDot.Core.Maui` package gives you:

- **Halo.Core for .NET.** The full Halo.Core Android API (`HaloCoreAndroid` and its types), ready to call from C#.
- **`UseHalo()`.** One line in `MauiProgram.cs` wires everything up.
- **`IHaloClient`.** Initialise, take a payment and cancel, using familiar .NET tasks and events.
- **`HaloConfig`.** Simple builders for Halo.Core's transaction and terminal settings.
:::note
Halo.Core for .NET MAUI runs on **Android**.
:::

## What you'll need

| Item | Details |
| --- | --- |
| **Device** | Android 10 (API 29) or later, with NFC |
| **Tooling** | .NET 10 with the `maui-android` workload |
| **Host Activity** | A `MauiAppCompatActivity` (the MAUI default) |
| **Repository credentials** | An access key and secret from Halo Dot, used to download Halo.Core when you build |
| **Token** | A Halo Dot JWT, issued through your backend |
| **Terminal configuration** | CA public keys and kernel combinations, supplied by Halo Dot |

## 1. Add the package

```bash
dotnet add package HaloDot.Core.Maui
```

Building a cross-platform app? Reference the package for Android only, and wrap your Halo.Core code in `#if ANDROID`:

```xml
<PackageReference Include="HaloDot.Core.Maui" Version="x.y.z"
                  Condition="'$(TargetFramework)' == 'net10.0-android'" />
```

## 2. Add your repository credentials

Halo.Core is downloaded securely from Halo Dot's repository when you build your app, using the credentials Halo Dot gives you. Create a `local.properties` file next to your `.csproj`:

```properties
aws.accesskey=<your access key>
aws.secretkey=<your secret>
# Optional: only for temporary credentials that come with a session token.
aws.token=<your token>
```

:::warning
**Keep this file private.** Add `local.properties` to your `.gitignore` so it never reaches source control.
:::

- **CI builds:** set the environment variables `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` instead (and `AWS_SESSION_TOKEN` if you have one).
- **Different location:** build with `-p:HaloLocalProperties=<path>`.
The package already chooses the right Halo.Core version, so don't add Halo.Core to your project yourself. Your first build downloads Halo.Core once, so it takes a little longer than later builds.

## 3. Set up

```csharp
// MauiProgram.cs
builder.UseMauiApp<App>()
       .UseHalo(o => o.GetToken = ct => myBackend.GetHaloTokenAsync(ct));
```

That's the whole setup. `UseHalo()` registers `IHaloClient` and connects Halo.Core to your app's lifecycle, so your `MainActivity` needs no Halo Dot code.

`GetToken` supplies a Halo Dot JWT from your backend whenever Halo.Core asks for one. Cache the token on your side to keep things fast. If `GetToken` throws, initialisation fails.

## 4. Take a payment

```csharp
using HaloDot;
using HaloDot.Android.Core.Models;
using HaloDot.Android.Core.Transaction;

// 1. Initialise once.
var init = await halo.InitializeAsync();
if (init is HaloInitializationResult.Failure f)
{
    // Check f.ResultType and f.ErrorCode.
}

// 2. Show Halo.Core's prompts ("Tap card", etc.) to your merchant.
halo.UiMessage += (_, m) => status.Text = m.ToString();

// 3. Your terminal configuration, from Halo Dot.
var terminal = HaloConfig.Terminal(caPublicKeys, combinations,
    tapTimeout: TimeSpan.FromSeconds(30), nfcTimeout: TimeSpan.FromSeconds(5));

// 4. The transaction: R 1.00 (amounts are in cents), with the EMV tags your acquirer needs.
var config = HaloConfig.Transaction(100, "ZAR", TransactionType.Purchase, terminal,
    plaintextTags: ["9F02", "5F2A", "9C"], encryptedTags: ["5A", "57"]);

// 5. Tap.
var result = await halo.StartTransactionAsync(config);
if (result is ITransactionResult.OnlineRequest online)
{
    // Send it to your backend for authorisation.
    // Then either collect a PIN...
    //   var next = await halo.ContinueWithPinAsync(online);
    // ...or finish without one:
    online.PinContinuation?.Finish();
}
```

Your backend verifies and decrypts the online request before sending it for authorisation. See [Transaction data](/docs/4.2/documentations/core/backend/transaction-data).

### EMV tags

`plaintextTags` come back in the clear, and `encryptedTags` come back encrypted for your backend. Halo.Core never returns card data in the clear. If you put one of these tags in `plaintextTags`, it's left out of the result, with no error:

`5A`, `56`, `57`, `58`, `5F20`, `5F24`, `5F53`, `9F0B`, `9F1F`, `9F20`, `9F2D`, `9F46`, `9F6B`

These cover the card number, track data, cardholder name, expiry date and the card's certificates. Request them in `encryptedTags` instead.

Any other tag can go in both lists, and then comes back both in the clear and encrypted. More in [EMV tags](/docs/4.2/documentations/core/tags).

### Transaction results

| Result | What it means |
| --- | --- |
| **`OnlineRequest`** | The card was read. Send it to your backend for authorisation |
| **`Declined`** | Declined on the device |
| **`Cancelled`** | Cancelled by `CancelTransaction()` or your cancellation token |
| **`Failed`** | The transaction couldn't complete |
| **`CardTapTimeOut`** | No card was tapped in time |
| **`PinCancelled`** | The cardholder cancelled PIN entry |
| **`PinAttestationFailed`** | The device's security check for this PIN transaction failed. Carries no card data |

Approval happens on your backend, using the online request. Every result and its fields are described in [Transaction results](/docs/4.2/documentations/core/transactions).

### The API

```csharp
public interface IHaloClient
{
    Task<HaloInitializationResult> InitializeAsync(CancellationToken cancellationToken = default);
    Task<ITransactionResult> StartTransactionAsync(TransactionConfig config, CancellationToken cancellationToken = default);
    Task<ITransactionResult> ContinueWithPinAsync(ITransactionResult.OnlineRequest request);
    void CancelTransaction();

    event EventHandler<ITransactionEvent.UiMessage>? UiMessage;

    string Version { get; }
}
```

- Events arrive on the main thread, ready to update your UI.
- `StartTransactionAsync` throws `TransactionStartException` if no transaction can start. It throws `InvalidOperationException` if a transaction is already running. Cancelling its token cancels the transaction, which then returns `Cancelled`.
- `HaloConfig.Transaction`, `HaloConfig.Terminal` and `HaloConfig.Tag` build `TransactionConfig`, `TerminalConfig` and `ParsedTagValue`. Create `CaPublicKey`, `CombinationConfig` and `BlockedCard` with their own constructors.
- Need more? The full Halo.Core API is available through `HaloDot.Android.Core.HaloCoreAndroid.Companion.Instance`.
## Protecting card data

The transaction result carries card data and goes straight to your code. The package never keeps a copy.

:::warning
**Don't log or store the transaction result.** Pass it to your backend for authorisation, then let it go.
:::

## Troubleshooting

| Problem | Likely cause |
| --- | --- |
| **`Access key cannot be null`, or `Could not resolve za.co.synthesis.halo:core`** when building | Your repository credentials are missing or incorrect. See [step 2](#2-add-your-repository-credentials) |
| **Restore fails for iOS** | The package is Android only. Reference it for `net10.0-android` only |
| **`InitializeAsync` returns `Failure`** | The token has expired or is incorrect, `GetToken` threw, or the backend can't be reached |
| **`TransactionStartException`** | Call `InitializeAsync` first and check that it returned `Success` |
| **`ArgumentOutOfRangeException` from `HaloConfig.Transaction`** | Amounts must be in cents, 0 to 12 digits |
| **A tag you put in `plaintextTags` is missing from the result** | It's card data, which only comes back encrypted. Request it in `encryptedTags`. See [EMV tags](#emv-tags) |
| **Duplicate class errors at build** | The app also references `HaloDot.SdkUi.Maui`. Use one package or the other |

Your Halo Dot contact can help with credentials, tokens, terminal configuration and anything else in your integration.


