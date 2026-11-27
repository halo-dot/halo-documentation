---
description: >-
  The UI messages Halo.SDK sends during a transaction, and what to show your
  merchant and cardholder.
sidebar_position: 3.5
---

# UI messages

While a transaction runs, Halo.SDK sends UI messages telling your app what to show the merchant and cardholder: "Present card", "Processing", "Enter PIN" and so on. They follow the EMV contactless user interface requests, so the same message means the same thing whichever card brand is tapped.

In .NET they arrive through the `IHaloClient.UiMessage` event, on the main thread. See [Halo.SDK for .NET MAUI](/docs/4.2/documentations/core/maui).

## What a message carries

| Field | Type | Meaning |
| --- | --- | --- |
| `type` | `UiMessageType` | The message to show. See [Message types](#message-types) |
| `status` | `TransactionStatus` | Where the transaction is, for a status indicator. See [Statuses](#statuses) |
| `holdTimeMs` | 64-bit integer | How long the message should stay on screen, in milliseconds |
| `languagePreference` | List of language codes | The cardholder's preferred languages, as the card reports them, most preferred first. May be empty |
| `value` | `None`, `Amount` or `Balance` | An amount to show with the message, with its currency |

## Showing messages

- **Text.** Map each message type to your own wording and translations. Each type also has a short default English text (its string form, `ToString()` in .NET), but that's for development and logs, not for your merchant or cardholder.
- **Languages.** Show the message in the first language in `languagePreference` that your app supports, and fall back to your app's own language.
- **No text.** `None` and `NotApplicable` carry no text. `ClearDisplay` means clear the message from the screen.
- **Amounts.** When `value` is `Amount` or `Balance`, show it with the message, for example the balance with a `Balance` message.

## Message types

| Type | Default text (development and logs) |
| --- | --- |
| `None` | (none) |
| `Amount` | Amount |
| `AmountOk` | Amount OK? |
| `Approved` | Approved |
| `ContactYourBank` | Call your bank |
| `CancelOrEnter` | Cancel or enter |
| `CardError` | Card error |
| `DeclinedOrNotAuthorised` | Declined |
| `EnterAmount` | Enter amount |
| `PleaseEnterPin` | Enter PIN |
| `IncorrectPin` | Incorrect PIN |
| `NotAccepted` | Not accepted |
| `PinOk` | PIN OK |
| `PleaseWait` | Please wait |
| `ProcessingError` | Processing error |
| `RemoveCard` | Remove card |
| `UseChipReader` | Use chip reader |
| `UseMagStripe` | Use magstripe |
| `TryAgain` | Try again |
| `Welcome` | Welcome |
| `PresentCard` | Present card |
| `Processing` | Processing |
| `OkRemoveCard` | Card read OK. Please remove card |
| `InsertOrSwipeCard` | Insert or swipe card |
| `PresentOneCardOnly` | Please present one card only |
| `ApprovedSign` | Approved. Please sign |
| `AuthorisingWait` | Authorising. Please wait |
| `TryAnotherCard` | Try another card |
| `InsertCard` | Please insert card |
| `ClearDisplay` | (clears the display) |
| `SeePhoneForInstructions` | See phone for instructions |
| `PresentCardAgain` | Present card again |
| `NotApplicable` | (none) |
| `Balance` | Balance |
| `DeclinedNoResponse` | Declined. No response |

The set follows EMV's standard user interface messages. Not every kernel sends every message.

## Statuses

| Status | Meaning |
| --- | --- |
| `NotReady` | The reader isn't ready yet |
| `Idle` | No transaction in progress |
| `ReadyToReadPresentCard` | Waiting for a card |
| `Processing` | Processing the card |
| `CardReadSuccessfulRemoveCard` | The card was read; it can be removed |
| `ProcessingError` | The card read failed |
| `NotApplicable` | The message carries no status |

UI messages tell you what to show while the transaction runs. They don't tell you how it ended: that's the [transaction result](/docs/4.2/documentations/core/transactions).
