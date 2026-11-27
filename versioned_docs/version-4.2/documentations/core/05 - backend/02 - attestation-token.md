---
description: >-
  Halo Dot's signed statement of a device attestation: its layout, how to
  verify it, and what to do when one fails.
---

# Attestation tokens

An attestation token is Halo Dot's signed statement of how one device attestation went. Halo Dot issues one for every attestation, pass or fail.

You meet tokens in two places:

- **Inside transaction data**, in `attestation_token`. Check it as part of [verifying the transaction data](/docs/4.2/documentations/core/backend/transaction-data#verifying).
- **In a `PinAttestationFailed` result**, on its own. The token says the attestation failed, but not why: [look it up](#looking-up-an-attestation-result) to find out.

## Layout

```
[varint signature length][signature]
[version]                            one byte, currently 1
[AttestationToken protobuf]          to the end
```

The signature length is a protobuf varint[^varint].

The signature is DER ECDSA-SHA256[^ecdsa] (P-256) by the signer's key, over the version byte and the protobuf, exactly as received.

## Verifying

The signer is named inside the token, so:

1. **Check the version byte**, then decode the protobuf.
2. **Check that `descriptor` is `"halo attestation-token"`.**
3. **Get the signer's certificate chain** for `signer_serial` from Halo Dot (TODO: endpoint), and cache it per serial.
4. **Validate the chain** up to the Halo Dot root certificate: the same root as for [transaction data](/docs/4.2/documentations/core/backend/transaction-data#verifying).
5. **Verify the signature.**

Act on nothing in the token before the signature verifies. Don't assume the same certificate signs every token: `signer_serial` says which one did.

There's no revocation check: validating the chain is enough.

`expires_at_unix` is for freshness: [transaction data](/docs/4.2/documentations/core/backend/transaction-data#verifying) must arrive before its token expires. An expired token can still be [looked up](#looking-up-an-attestation-result).

[C# samples](/docs/4.2/documentations/core/backend/csharp-samples) show these steps in .NET.

## Schema

```proto
syntax = "proto3";

package halo.attestation_token.v1;

message AttestationToken {
  // The attestation's id: a 16-byte UUID. The same id as attestationId in
  // the attestation result.
  bytes attestation_id = 1;

  // Always "halo attestation-token": identifies what was signed.
  string descriptor = 2;

  // Serial of the Halo Dot certificate that signed this token, raw bytes.
  bytes signer_serial = 3;

  // The attested device: Halo Dot's 16-byte device id, and the serial of its
  // device signing certificate, raw bytes.
  bytes device_id = 4;
  bytes device_signing_serial = 5;

  // Unix seconds, Halo Dot's clock.
  int64 issued_at_unix = 6;
  int64 expires_at_unix = 7;

  Verdict verdict = 8;

  // 16 bytes. Set when the attestation was started at the beginning of a
  // transaction: that transaction's id. Absent otherwise. At that point
  // nobody knows whether the transaction will need a PIN, so the id only
  // says which transaction the attestation was started for.
  //
  // A transaction without a PIN carries the device's latest attestation, so
  // its token may name a different transaction, or none; that is not an
  // error. Only a transaction with a PIN requires the token's id to equal
  // its own.
  bytes transaction_id = 9;
}

enum Verdict {
  VERDICT_UNSPECIFIED = 0; // never issued; reject
  PASS = 1;
  FAIL = 2;
}
```

## Looking up an attestation result

Your backend can send a token to Halo Dot to get the full result of that attestation, including why it failed. It works for any token, pass or fail.

```
POST /v1/attestation-results
Authorization: Bearer <the signed attestation token, Base64-encoded>
```

- **Host:** the Halo Dot server in your JWTs' `aud` claim, the same one Halo.SDK connects to. See [Claims](/docs/4.2/documentations/core/jwt#claims).
- **Request:** no body. The token is the credential: send the whole token, exactly as you received it, Base64-encoded. This is Halo Dot's attestation token, not a Google Play Integrity token. An expired token can still be looked up.

### Response

`200` with the attestation result:

```json
{
  "attestationId": "3f6b1c9e-27d4-4a8b-9e05-c1d2e3f4a5b6",
  "deviceInstallationId": "8e2d4c1a9b7f6e5d4c3b2a1908f7e6d5",
  "transactionId": null,
  "verdict": "FAIL",
  "policy": { "schemaVersion": 1, "revision": 42 },
  "claims": {
    "playIntegrity": {
      "deviceIntegrity": {
        "observed": ["MEETS_BASIC_INTEGRITY"],
        "requirement": { "contains": "MEETS_DEVICE_INTEGRITY" }
      }
    }
  },
  "errors": [{ "code": "CLAIM_POLICY_MISMATCH", "claimPath": "…" }]
}
```

| Field | Type | Meaning |
| --- | --- | --- |
| `attestationId` | UUID | The attestation's id: the token's `attestation_id`, written as a UUID |
| `deviceInstallationId` | String | The token's `device_id`, as 32 lowercase hex characters: the same id Halo.SDK returns from [initialization](/docs/4.2/documentations/core/initialization) |
| `transactionId` | UUID, or `null` | The token's `transaction_id`, written as a UUID. `null` when the token has none |
| `verdict` | `PASS` or `FAIL` | Same as the token's verdict |
| `policy.schemaVersion` | Integer | The version of Halo Dot's attestation policy format the result was checked against |
| `policy.revision` | Integer | The policy's revision within that format |
| `claims` | Object | Left out for a pass. For a fail, only the claims that failed the policy, by provider. See [Claims](#claims) |
| `errors` | Array | Why the attestation failed: a `code`, such as `CLAIM_POLICY_MISMATCH`, and the `claimPath` it applies to when there is one. The codes aren't a closed list: treat them as opaque strings, and don't fail on one you don't know |

### Claims

Each claim gives what the device reported, `observed`, and what the policy required, `requirement`:

- `observed` is the reported value, or the string `"missing"` when the device didn't report it.
- `requirement` is `{ "equals": … }`, or `{ "contains": … }` for a list that must include a value.

Expect values beyond the ones listed here: Google adds new ones over time.

**`playIntegrity`**, from Google Play Integrity:

| Claim | Observed | Meaning |
| --- | --- | --- |
| `deviceIntegrity` | List of strings | Device labels, such as `MEETS_BASIC_INTEGRITY`, `MEETS_DEVICE_INTEGRITY`, `MEETS_STRONG_INTEGRITY` and `MEETS_VIRTUAL_INTEGRITY` |
| `appRecognition` | String | `PLAY_RECOGNIZED`, `UNRECOGNIZED_VERSION` or `UNEVALUATED` |
| `appLicensing` | String | `LICENSED`, `UNLICENSED` or `UNEVALUATED` |
| `certificateSha256Digest` | List of strings | SHA-256 digests of the app's signing certificates, in URL-safe Base64 as Google returns them: 43 characters unpadded, or 44 with a trailing `=`. Compare the decoded bytes, not the text |
| `versionCode` | String | The app's version code, as a decimal string. Don't parse it into a fixed-size integer |
| `packageName` | String | The app's package name |
| `observedAt` | Timestamp | When Google answered. A plain date-time, with no requirement |

**`keyAttestation`**, from Android key attestation:

| Claim | Observed | Meaning |
| --- | --- | --- |
| `attestationSecurityLevel` | String or integer | Where the attestation was made: `Software`, `TrustedEnvironment` or `StrongBox`, or the raw value if it's none of these |
| `keymasterSecurityLevel` | String or integer | Where the key lives, with the same values |
| `softwareEnforced`, `hardwareEnforced` | Object | The key's authorisations, as enforced by software or by secure hardware. Each can hold the claims below |
| `….rootOfTrust.verifiedBootState` | String or integer | `Verified`, `SelfSigned`, `Unverified` or `Failed`, or the raw value if it's none of these |
| `….rootOfTrust.deviceLocked` | Boolean | Whether the bootloader is locked |
| `….osVersion` | Integer | The Android version |
| `….osPatchLevel` | Integer | The security patch level |
| `….vendorPatchLevel`, `….bootPatchLevel` | Integer | The vendor and boot image patch levels. Only from key attestation version 3, and optional there |

### Errors

| Status | Meaning |
| --- | --- |
| `400` | The request or the token is invalid |
| `401` | The token is missing from `Authorization`, malformed, or its signature doesn't verify |
| `403` | Your backend isn't allowed to see this attestation |
| `404` | No matching attestation result |

## Receiving results by webhook

Instead of looking results up, your backend can have Halo Dot send it every attestation result as it happens. Halo Dot POSTs the same body as the [lookup response](#response) to a URL you choose.

- **Setting it up:** send Halo Dot your receiver URL and your credentials (OAuth client credentials or an API key) in advance. Halo Dot adds them to its configuration for the environment; there's no self-service setup.
- **Authentication:**
  - **OAuth 2 client credentials** (preferred): you provision a client for Halo Dot, which gets an access token from your token endpoint and sends it as a bearer token.
  - **API key:** a key you supply, which Halo Dot sends in `X-API-Key`.
- **Acknowledging:** answer `200` or `204`.
- **Retries:** a `5xx` answer is retried, up to three times by default. TODO: backoff schedule. A `4xx` answer isn't retried.
- **Duplicates:** each result is delivered once, but if your acknowledgement is lost, a retry repeats it. Deduplicate by `attestationId`.

## Example

```
48 3046…                                 signature length 72, signature
01                                       version 1
0a10 3f6b1c9e27d44a8b9e05c1d2e3f4a5b6    attestation_id
1216 68616c6f206174746573746174696f6e2d746f6b656e   descriptor "halo attestation-token"
1a04 1c77e0a2                            signer_serial
2210 8e2d4c1a9b7f6e5d4c3b2a1908f7e6d5    device_id
2a08 4a1f0c9e7d2b33a1                    device_signing_serial
30 d089f0d706                            issued_at_unix 1794901200
38 e0a5f0d706                            expires_at_unix 1794904800
40 01                                    verdict PASS
```

[^varint]: See [Base 128 varints](https://protobuf.dev/programming-guides/encoding/#varints) in the protobuf encoding guide.
[^ecdsa]: ECDSA with SHA-256, as in [FIPS 186-5](https://csrc.nist.gov/pubs/fips/186-5/final). The signature is DER-encoded as `Ecdsa-Sig-Value` ([RFC 3279, section 2.2.3](https://www.rfc-editor.org/rfc/rfc3279#section-2.2.3)), the form most crypto libraries produce and accept.
