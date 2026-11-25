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

The signature is DER ECDSA-SHA256 over the version byte and the protobuf, exactly as received.

## Verifying

The signer is named inside the token, so:

1. **Check the version byte**, then decode the protobuf.
2. **Check that `descriptor` is `"halo attestation-token"`.**
3. **Get the signer's certificate chain** for `signer_serial` from Halo Dot (TODO: endpoint), and cache it per serial.
4. **Validate the chain** up to the Halo Dot root certificate.
5. **Verify the signature.**

Act on nothing in the token before the signature verifies. Don't assume the same certificate signs every token: `signer_serial` says which one did.

## Schema

```proto
syntax = "proto3";

package halo.attestation_token.v1;

message AttestationToken {
  // Always "halo attestation-token": identifies what was signed.
  string descriptor = 1;

  // Serial of the Halo Dot certificate that signed this token, raw bytes.
  bytes signer_serial = 2;

  // The attested device: Halo Dot's 16-byte device id, and the serial of its
  // device signing certificate, raw bytes.
  bytes device_id = 3;
  bytes device_signing_serial = 4;

  // Unix seconds, Halo Dot's clock.
  int64 issued_at_unix = 5;
  int64 expires_at_unix = 6;

  Verdict verdict = 7;

  // 16 bytes. Set when the attestation was started at the beginning of a
  // transaction: that transaction's id. Absent otherwise. A transaction
  // without a PIN carries the device's latest attestation, which may name a
  // different transaction; that is not an error.
  bytes transaction_id = 8;

  // TODO: attestation id (field number and type from the updated schema).
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
```

- **Host:** TODO
- **Authentication:** TODO

### Request

```json
{
  "token": "<the signed attestation token, Base64-encoded>"
}
```

Send the whole token, exactly as you received it.

### Response

`200` with the attestation result:

```json
{
  "attestationId": "8e2d4c1a-9b7f-4e5d-8c3b-2a1908f7e6d5",
  "verdict": "FAIL",
  "policy": { "schemaVersion": 1, "revision": 42 },
  "claims": { "…": "…" },
  "errors": [{ "code": "…", "claimPath": "…" }]
}
```

| Field | Type | Meaning |
| --- | --- | --- |
| `attestationId` | UUID | The attestation's id. TODO: relation to the token's attestation id |
| `verdict` | `PASS` or `FAIL` | Same as the token's verdict |
| `policy.schemaVersion` | Integer | TODO |
| `policy.revision` | Integer | TODO |
| `claims` | Object | What the device reported, by claim path. TODO: which claims are documented |
| `errors` | Array | Why the attestation failed: a `code`, and the `claimPath` it applies to when there is one. Empty for a pass. TODO: published codes, or informational only |

### Errors

| Status | Meaning |
| --- | --- |
| `400` | The request or the token is invalid |
| `401` | Your backend isn't authenticated |
| `403` | Your backend isn't allowed to see this attestation |
| `404` | No matching attestation result |

## Example

```
48 3046…                                 signature length 72, signature
01                                       version 1
0a16 68616c6f206174746573746174696f6e2d746f6b656e   descriptor "halo attestation-token"
1204 1c77e0a2                            signer_serial
1a10 8e2d4c1a9b7f6e5d4c3b2a1908f7e6d5    device_id
2208 4a1f0c9e7d2b33a1                    device_signing_serial
28 d089f0d706                            issued_at_unix 1794901200
30 e0a5f0d706                            expires_at_unix 1794904800
38 01                                    verdict PASS
```
