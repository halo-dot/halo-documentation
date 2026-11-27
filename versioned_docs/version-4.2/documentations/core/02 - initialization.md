---
description: >-
  What initialising Halo.SDK does, and every result it can return.
sidebar_position: 2.3
---

# Initialization

Initialise Halo.SDK once your app can supply a [JWT](/docs/4.2/documentations/core/jwt), before the first transaction. A successful initialisation means the device is ready to take payments: it is registered with Halo Dot, has fresh entropy from Halo Dot, and holds its payment keys.

Initialisation does three things, in order:

1. **Registers the device** with the Halo Dot server named in the token's `aud`, verifying the server against the token's `aud_fingerprints`.
2. **Gets entropy** from Halo Dot and mixes it into the device's random number generator.
3. **Loads the device's payment keys** through remote key injection (RKI). A device that already has its keys skips this.

If any step fails, initialisation fails and no transaction can start: until it succeeds, transactions end with `Failed(NotInitialized)`. Call it again to retry.

In .NET, call `InitializeAsync`; see [Halo.SDK for .NET MAUI](/docs/4.2/documentations/core/maui).

## Results

An initialisation returns exactly one of these:

| Result | Carries |
| --- | --- |
| `Initialized` | `deviceInstallationId` |
| `Failed` | `error`, and `deviceInstallationId` when the device got far enough to have one |

`deviceInstallationId` is the device's id in Halo Dot's records, as a hex string. Quote it to Halo Dot when you ask about a device.

## Errors

| Error | Meaning | What to do |
| --- | --- | --- |
| `TokenUnavailable` | Your app's token callback failed | Check your callback and your backend's token endpoint |
| `TokenInvalid` | The token isn't a JWT, or is missing `aud` or `aud_fingerprints` | Check the token against [Claims](/docs/4.2/documentations/core/jwt#claims) |
| `TokenRejected` | Halo Dot rejected the token: its signature, issuer or expiry | Check your key is registered and the token hasn't expired. [Checking a token](/docs/4.2/documentations/core/jwt#checking-a-token) shows why |
| `NetworkError` | Halo Dot couldn't be reached, or the connection dropped | Retry when the device is online |
| `RegistrationRejected` | Halo Dot refused to register the device | Contact Halo Dot with the `deviceInstallationId` |
| `ServerUnverified` | A response from Halo Dot couldn't be verified | Check nothing on the network intercepts the connection, then retry. If it persists, contact Halo Dot |
| `EntropyFailed` | The device couldn't get or apply entropy from Halo Dot | Retry. If it persists, contact Halo Dot with the `deviceInstallationId` |
| `RkiFailed` | The device's payment keys couldn't be loaded | Retry. If it persists, contact Halo Dot with the `deviceInstallationId` |
| `InternalError` | Anything else on the device failed during setup | Retry. If it persists, contact Halo Dot |

Match on the error itself. Each error's string form is a short message for development and logs, not for your merchant.
