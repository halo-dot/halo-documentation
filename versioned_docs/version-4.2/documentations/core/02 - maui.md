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

`HaloConfig.Transaction` takes `plaintextTags` and `encryptedTags` as hex strings, one tag per entry, such as `"9F02"`, in either case. Which tags come back, and how, is in [EMV tags](/docs/4.2/documentations/core/tags).

### Transaction results

Results are Halo.Core's own types, bound into `HaloDot.Android.Core.Transaction`: match on `ITransactionResult.OnlineRequest`, `ITransactionResult.Declined` and so on. What each result means and carries is in [Transaction results](/docs/4.2/documentations/core/transactions).

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
- `StartTransactionAsync` throws `TransactionStartException` if Halo.Core rejects the terminal configuration (for example, a malformed CA public key). It throws `InvalidOperationException` if a transaction is already running. Cancelling its token cancels the transaction, which then returns `Cancelled`.
- `HaloConfig.Transaction`, `HaloConfig.Terminal` and `HaloConfig.Tag` build `TransactionConfig`, `TerminalConfig` and `ParsedTagValue`. Create `CaPublicKey`, `CombinationConfig` and `BlockedCard` with their own constructors.
- The transaction result goes straight to your code. The package never keeps or logs a copy.
- Need more? The full Halo.Core API is available through `HaloDot.Android.Core.HaloCoreAndroid.Companion.Instance`.

## Troubleshooting

| Problem | Likely cause |
| --- | --- |
| **`Access key cannot be null`, or `Could not resolve za.co.synthesis.halo:core`** when building | Your repository credentials are missing or incorrect. See [step 2](#2-add-your-repository-credentials) |
| **Restore fails for iOS** | The package is Android only. Reference it for `net10.0-android` only |
| **`InitializeAsync` returns `Failure`** | The token has expired or is incorrect, `GetToken` threw, or the backend can't be reached |
| **`TransactionStartException`** | Halo.Core rejected the terminal configuration, for example a malformed CA public key. Check the configuration Halo Dot supplied |
| **`ArgumentOutOfRangeException` from `HaloConfig.Transaction`** | Amounts must be in cents, 0 to 12 digits |
| **`Java.Lang.IllegalArgumentException` from `HaloConfig.Transaction`** | A tag in `plaintextTags` or `encryptedTags` isn't a valid EMV tag: hex, 1 to 3 bytes, such as `9F02` |
| **Duplicate class errors at build** | The app also references `HaloDot.SdkUi.Maui`. Use one package or the other |

Your Halo Dot contact can help with credentials, tokens, terminal configuration and anything else in your integration.


