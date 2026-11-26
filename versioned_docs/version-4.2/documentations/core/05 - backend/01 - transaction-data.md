---
description: >-
  The signed transaction data in an online request: its layout, how to verify
  it, and how to decrypt card data and PIN blocks.
---

# Transaction data

Every `OnlineRequest` carries signed transaction data. Your app passes it, with the signing chain, to your backend, which verifies it, decrypts what it needs and sends the transaction to your processor for authorisation.

## Layout

```
[varint signature length][signature]
[version]                            one byte, currently 1
[TransactionData protobuf]           to the end
```

- The signature length is a protobuf varint[^varint].
- The signature is DER ECDSA-SHA256[^ecdsa] (P-256) by the device signing key, over everything after it: the version byte and the protobuf, exactly as received.
- A version you don't know is a format you don't support: reject it.
- The protobuf's `descriptor` field (`"halo transaction-data"`) identifies what was signed.

## Verifying

1. **Validate the signing chain** from the result: the device signing certificate, then its issuer, up to the Halo Dot root certificate. There's no revocation check: validating the chain is enough.
2. **Verify the signature** over the rest of the bytes (version byte and protobuf) with the device signing certificate's key.
3. **Check the version byte, then decode the protobuf.** Check that `descriptor` is `"halo transaction-data"` before trusting any other field. `signing_serial` must equal the device signing certificate's serial.
4. **Verify the attestation token** in `attestation_token` (see [Attestation tokens](/docs/4.2/documentations/core/backend/attestation-token)). It must have verdict `PASS`, name this device (`device_signing_serial` equal to `signing_serial`), and not have expired when the data arrived.
5. **Match the token to the transaction.** With a PIN block, the token's `transaction_id` must equal this `transaction_id`. Without one, ignore the token's `transaction_id`: a different id there is normal, since the device's latest attestation may have been started for an earlier transaction.
6. **Deduplicate on `transaction_id`.** An id may legitimately appear twice: once without a PIN block, then once with one (a [PIN continuation](/docs/4.2/documentations/core/transactions#pin-continuation)). Reject anything else as a repeat.

:::warning
Act on nothing in the transaction data until every check above has passed.
:::

[C# samples](/docs/4.2/documentations/core/backend/csharp-samples) cover steps 1 to 5.

## Decrypting

Card data and PIN blocks are encrypted under AES DUKPT (ANSI X9.24-3) keys, from two separate base derivation keys (BDKs): one for card data, one for PIN blocks.

- **`encrypted_tlvs`**: AES-128-CBC with PKCS#7 padding and IV `data_iv`, under the DUKPT data encryption key for `data_ksn`, derived from your data BDK. The cleartext is concatenated BER-TLVs, in the same format as the plaintext EMV data. Absent when none of your `encryptedTags` was produced.
- **`pin_block`**: ISO 9564 format 4, encrypted under the DUKPT PIN encryption key for `pin_ksn`, derived from your PIN BDK. Translate it in your HSM for your processor.

## Schema

```proto
syntax = "proto3";

package halo.transaction_data.v1;

message TransactionData {
  // Always "halo transaction-data": identifies what was signed.
  string descriptor = 1;

  // 16 bytes: the transaction id, a random (version 4) UUID, in RFC 9562
  // byte order (big-endian: the bytes in the order of the canonical string
  // form).
  bytes transaction_id = 2;

  // Device clock, Unix seconds, when this object was built: the end of the
  // card read, or of PIN entry for a PIN continuation.
  int64 device_timestamp_unix = 3;

  // Serial of the device signing certificate that signed this object, raw
  // bytes.
  bytes signing_serial = 4;

  // The tags listed in plaintextTags, minus sensitive ones: BER-TLVs,
  // concatenated in no particular order, each tag at most once. The same
  // bytes your app received.
  bytes plaintext_tlvs = 5;

  // The masked PAN. Always present.
  string masked_pan = 6;

  // The tags listed in encryptedTags, concatenated like plaintext_tlvs,
  // PKCS#7 padded, AES-128-CBC under the DUKPT data encryption key for
  // data_ksn. All three absent when none of those tags was produced.
  bytes encrypted_tlvs = 7;
  bytes data_iv = 8;  // 16 bytes
  bytes data_ksn = 9; // 12 bytes, AES DUKPT (ANSI X9.24-3)

  // Present when a PIN was taken: ISO 9564 format 4, 16 bytes, under the
  // DUKPT PIN encryption key for pin_ksn.
  bytes pin_block = 10;
  bytes pin_ksn = 11; // 12 bytes

  // The signed attestation token, as issued.
  bytes attestation_token = 12;
}
```

A PIN continuation's transaction data repeats the first one's fields byte for byte, except `device_timestamp_unix`, `pin_block`, `pin_ksn` and `attestation_token`.

## Example

An online request without a PIN (Visa test card), with:

- `plaintextTags` = `9F02 5F2A 9C 84 9F26`
- `encryptedTags` = `5A 5F24`

The cleartext `5A0847617390010101195F2403281231` is encrypted into `encrypted_tlvs`. The keys are example keys; the encryption key is not a real DUKPT derivation.

```
48                                       signature length 72
3046…                                    DER ECDSA signature
01                                       version 1
0a15 68616c6f207472616e73616374696f6e2d64617461   descriptor "halo transaction-data"
1210 6f1c2a4e8b3d4e5f9a7b2c1d0e9f8a76    transaction_id
18 8c93f0d706                            device_timestamp_unix 1794902412
2208 4a1f0c9e7d2b33a1                    signing_serial
2a25 9f0206…3d7f0e41                     plaintext_tlvs (37 bytes)
3210 34373631373339302a2a2a2a30313139    masked_pan "47617390****0119"
3a20 2430cc6f…f3249590                   encrypted_tlvs (32 bytes)
4210 a1b2c3d4e5f60718293a4b5c6d7e8f90    data_iv
4a0c 0123456789abcdef00000007            data_ksn
62a401 4830…4001                         attestation_token (164 bytes)
```

After a "PIN required" soft decline, continuing with PIN produces new transaction data with the same `transaction_id`, `encrypted_tlvs`, `data_iv` and `data_ksn`, plus `pin_block` and `pin_ksn`, a new `device_timestamp_unix` and a new attestation token.

[^varint]: See [Base 128 varints](https://protobuf.dev/programming-guides/encoding/#varints) in the protobuf encoding guide.
[^ecdsa]: ECDSA with SHA-256, as in [FIPS 186-5](https://csrc.nist.gov/pubs/fips/186-5/final). The signature is DER-encoded as `Ecdsa-Sig-Value` ([RFC 3279, section 2.2.3](https://www.rfc-editor.org/rfc/rfc3279#section-2.2.3)), the form most crypto libraries produce and accept.
