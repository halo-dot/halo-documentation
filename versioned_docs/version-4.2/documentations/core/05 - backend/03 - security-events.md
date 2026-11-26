---
description: >-
  The security events Halo Dot sends your backend when Halo.SDK detects a
  threat on a device.
---

# Security events

When Halo.SDK detects a threat on a device, such as root or an overlay, Halo Dot sends your backend a security event. Events are separate from [attestation results](/docs/4.2/documentations/core/backend/attestation-token): an event isn't part of a lookup or of an attestation result webhook.

## Receiving events

Halo Dot POSTs one event per request to a URL you choose:

```json
{
  "eventType": "ROOTED",
  "deviceInstallationId": "8e2d4c1a9b7f6e5d4c3b2a1908f7e6d5",
  "timestamp": "2026-11-26T14:32:05Z"
}
```

| Field | Type | Meaning |
| --- | --- | --- |
| `eventType` | String | What was detected. See [Event types](#event-types) |
| `deviceInstallationId` | String | The device it was detected on, as 32 lowercase hex characters: the same id Halo.SDK returns from [initialization](/docs/4.2/documentations/core/initialization) |
| `timestamp` | Date-time | When Halo.SDK observed the event, as an RFC 3339 date-time |

Setup, authentication and retries work as for the [attestation result webhook](/docs/4.2/documentations/core/backend/attestation-token#receiving-results-by-webhook). As there, a retry after a lost acknowledgement can deliver an event you've already accepted.

## Event types

| Type | Meaning |
| --- | --- |
| `ROOTED` | The device is rooted |
| `CODE_PROTECTION` | The app's code protection detected tampering |
| `INSTRUMENTED` | An instrumentation or hooking framework is attached to the app |
| `DEVELOPER_MODE` | Developer options are on |
| `ACCESSIBILITY` | An accessibility service that can read or control the screen is active |
| `OVERLAY` | Another app is drawing over the app |
| `DEVICE_FILE_ENCRYPTION_STATE_INVALID` | Halo.SDK's encrypted storage on the device is in an invalid state |
| `DUKPT_STATE_INVALID` | The device's card data encryption keys are in an invalid state |
| `CAMERA_CONTROL_LOST` | Another app took control of the camera |
| `MICROPHONE_UNMUTED` | The microphone was unmuted |
