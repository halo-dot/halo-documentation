---
description: >-
  The transaction and terminal configuration you start a transaction with:
  every field, and what it's for.
sidebar_position: 2.5
---

# Configuration

Every transaction starts with a `TransactionConfig`: what to charge, and the `TerminalConfig` the card read runs with. You build both yourself. In .NET, build them with `HaloConfig.Transaction` and `HaloConfig.Terminal`; see [Halo.SDK for .NET MAUI](/docs/4.2/documentations/core/maui).

## TransactionConfig

| Field | Type | Meaning |
| --- | --- | --- |
| `amount` | Amount, in minor units | The amount to charge or refund: `100` is R 1.00. Zero or more, at most 12 digits |
| `amountOther` | Amount, in minor units | Always `0` for `Purchase` and `Refund` |
| `currencyCode` | Currency | ISO 4217, by alphabetic (`ZAR`) or numeric (`710`) code |
| `transactionType` | `TransactionType` | See [Transaction types](#transaction-types) |
| `plaintextTags` | Requested tags | EMV tags to return in the clear. See [EMV tags](/docs/4.2/documentations/core/tags) |
| `encryptedTags` | Requested tags | EMV tags to return encrypted. See [EMV tags](/docs/4.2/documentations/core/tags) |
| `terminalConfig` | `TerminalConfig` | See [TerminalConfig](#terminalconfig) |

### Transaction types

| Type | EMV value (tag `9C`) |
| --- | --- |
| `Purchase` | `00` |
| `Refund` | `20` |

## TerminalConfig

| Field | Type | Meaning |
| --- | --- | --- |
| `caPublicKeys` | List of `CaPublicKey` | The card schemes' certification authority public keys, for offline data authentication. See [CaPublicKey](#capublickey) |
| `combinations` | List of `CombinationConfig` | The applications, kernels and transaction types you accept, each with its kernel configuration. See [CombinationConfig](#combinationconfig) |
| `blockedCards` | List of `BlockedCard` | Cards to refuse. May be empty. See [BlockedCard](#blockedcard) |
| `tapTimeout` | Duration | How long to wait for a card to be tapped. When it runs out, the result is `CardTapTimeOut` |
| `nfcTimeout` | Duration | How long to wait for the card to answer each command before the read fails |

### CaPublicKey

One certification authority public key, as the card scheme publishes it. Use the test keys for testing and the live keys in production; your acquirer can supply the set for your environment.

| Field | Type | Meaning |
| --- | --- | --- |
| `index` | 1 byte | The CA public key index (tag `8F`) |
| `rid` | 5 bytes | The scheme's registered application provider identifier, such as `A000000003` for Visa |
| `modulus` | Bytes | The key's modulus |
| `exponent` | Bytes | The key's exponent: `03` or `010001` |
| `keyBits` | Integer | The modulus length in bits, such as `1984` |
| `expiry` | Date | When the key expires |
| `sha1Hash` | 20 bytes | The key's SHA-1 checksum, as the scheme publishes it |
| `revokedSerials` | List of bytes | Serial numbers of issuer certificates this key has revoked (3 bytes each). May be empty |

### CombinationConfig

One application, kernel and transaction type you accept, with the kernel configuration to use for it. Add one for each combination you accept: a card whose application has no combination for the transaction's type is declined with `NoSupportedApplication`.

| Field | Type | Meaning |
| --- | --- | --- |
| `aid` | 5 to 16 bytes | The application identifier, such as `A0000000031010` (Visa credit or debit) |
| `kernelId` | Integer | The EMV contactless kernel: `2` Mastercard, `3` Visa, `4` American Express, `6` Discover |
| `transactionType` | `TransactionType` | The transaction type this configuration applies to |
| `tagDatabase` | List of tag/value pairs | Halo.SDK's terminal tags and the kernel's own configuration for this combination: tags of 1 to 3 bytes, each with its value. See [Tag database](#tag-database) |

### Tag database

A combination's tag database holds two kinds of tags.

**Halo.SDK terminal tags** set the checks Halo.SDK runs before handing the card to the kernel: contactless limits, floor limits and zero amounts. Flags are 1 byte, `01` for on and `00` for off. Amounts are in minor units, as BCD: `000000010000` is R 100.00.

| Tag | Name | Format | Meaning | When left out |
| --- | --- | --- | --- | --- |
| `EF8101` | Reader contactless transaction limit | Amount, up to 6 bytes | Transactions at or above this amount can't use this combination. Checked only when `EF8106` is on | No limit |
| `EF8102` | Status check supported | Flag | A transaction of exactly one unit of the currency is sent online as a status check | Off |
| `EF8103` | Zero amount allowed | Flag | `00` refuses zero-amount transactions for this combination. When on, they're allowed and sent online | Allowed |
| `EF8104` | Zero amount allowed offline | Flag | Zero-amount transactions skip the zero-amount checks of `EF8103` | Off |
| `EF8106` | Reader contactless transaction limit check | Flag | Turns on the `EF8101` check | Off |
| `EF8107` | Reader contactless floor limit check | Flag | Turns on the `DF8123` check. Must be set to `00`, not left out, for the terminal floor limit check (`EF8108`) to run | Off, and the terminal floor limit check doesn't run |
| `EF8108` | Terminal floor limit check | Flag | Turns on the `9F1B` check. Runs only when `EF8107` is `00` | Off |
| `EF8109` | Reader CVM required limit check | Flag | Turns on the `DF8126` check | Off |

Halo.SDK also reads these standard tags from the tag database, for every kernel:

| Tag | Name | Format | Meaning |
| --- | --- | --- | --- |
| `DF8123` | Reader contactless floor limit | Amount, BCD | Transactions above this amount are sent online. Checked only when `EF8107` is on |
| `9F1B` | Terminal floor limit | Amount, binary | Transactions above this amount are sent online. Checked only when `EF8108` is on |
| `DF8126` | Reader CVM required limit | Amount, BCD | Transactions at or above this amount require cardholder verification. Checked only when `EF8109` is on |
| `9F66` | Terminal transaction qualifiers | 4 bytes | Required. Halo.SDK sets its online and cardholder verification bits for each transaction from the checks above |
| `DF812D` | Message hold time | 3 bytes, BCD, in units of 100 ms | How long Halo.SDK's own UI messages stay on screen. Left out, `000013` (1.3 seconds) |

**Kernel tags** configure the kernel itself: its capabilities, limits and the data it sends to the card. Which tags a kernel reads, their formats and their values are set by its specification: consult the kernel's documentation (EMV Contactless Book C-2 for Mastercard, C-3 for Visa, C-4 for American Express and C-6 for Discover) and your acquirer's requirements.

### BlockedCard

A card the terminal refuses: an entry in the EMV terminal exception file. A card matches when its PAN matches and, if a PAN sequence number is given, its PAN sequence number matches too.

| Field | Type | Meaning |
| --- | --- | --- |
| `pan` | Bytes | The PAN, encoded exactly as tag `5A`: packed BCD, padded with a trailing `F` when the PAN has an odd number of digits. `4761739001010119` is `47 61 73 90 01 01 01 19` |
| `panSequenceNumber` | 1 byte, or none | The PAN sequence number, encoded exactly as tag `5F34`: BCD, `01` for sequence number 1. None matches every card with this PAN |

## When it's checked

- **When you build it:** the amounts, the currency and the requested tags. An amount out of range, an unknown currency or a malformed tag fails right there.
- **When the transaction starts:** the terminal configuration. If it's rejected, for example because of a malformed CA public key, starting fails with `InvalidConfig`. See [Starting and cancelling](/docs/4.2/documentations/core/transactions#starting-and-cancelling).
