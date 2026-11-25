---
description: >-
  Choosing the EMV tags a transaction returns, in the clear and encrypted.
---

# EMV tags

You choose the EMV tags each transaction returns, in two lists in the transaction configuration. Nothing you didn't list comes back.

## Plaintext and encrypted tags

- **`plaintextTags`** come back in the clear, in the result your app receives and in the signed transaction data.
- **`encryptedTags`** come back only encrypted, inside the signed transaction data, for your backend to decrypt. Any tag can be listed here.

Card and terminal tags both count: you can list any tag the transaction saw. Listed tags the transaction didn't produce are left out, with no error.

A tag can be in both lists. If it isn't sensitive, it comes back both in the clear and encrypted.

## Sensitive tags

Halo.Core never returns card data in the clear. These tags are only ever returned encrypted:

| Tag | Name |
| --- | --- |
| `5A` | Application Primary Account Number (PAN) |
| `56` | Track 1 Data |
| `57` | Track 2 Equivalent Data |
| `58` | Track 3 Data |
| `5F20` | Cardholder Name |
| `5F24` | Application Expiration Date |
| `5F53` | International Bank Account Number (IBAN) |
| `9F0B` | Cardholder Name Extended |
| `9F1F` | Track 1 Discretionary Data |
| `9F20` | Track 2 Discretionary Data |
| `9F2D` | ICC PIN Encipherment Public Key Certificate |
| `9F46` | ICC Public Key Certificate |
| `9F6B` | Track 2 Data |

A sensitive tag in `plaintextTags` is left out of the result, with no error. List it in `encryptedTags` instead. A sensitive tag in both lists only comes back encrypted.

## Format

Each set of tags is concatenated BER-TLVs, each tag at most once, in no particular order. Your app also gets the plaintext set parsed into a list of tag/value pairs, in the same order as the bytes.

## Example

```csharp
plaintextTags: ["9F02", "5F2A", "9C", "84", "9F26"],
encryptedTags: ["5A", "5F24"]
```

- In the clear: amount, currency, transaction type, the selected application (AID) and the application cryptogram.
- Encrypted: the PAN and expiry date.
- Always present on its own: the [masked PAN](/docs/4.2/documentations/core/transactions#masked-pan), whatever you listed.

## Dynamic currency conversion

For DCC, list the card's currency (for example `9F42`, Application Currency Code) in `plaintextTags`, and read the BIN from the masked PAN.
