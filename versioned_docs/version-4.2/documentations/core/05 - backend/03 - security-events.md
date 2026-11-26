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
{ "eventType": "ROOTED" }
```

For now an event carries only its type. TODO: which device it came from, and other event details

- **Setting it up:** give Halo Dot your receiver URL and one way to authenticate. TODO: how it's configured
- **Authentication:** the same options as the [attestation result webhook](/docs/4.2/documentations/core/backend/attestation-token#receiving-results-by-webhook): OAuth 2 client credentials (preferred), or an API key in `X-API-Key`.
- **Acknowledging:** answer `200` or `204`. Any other answer isn't acknowledged, and Halo Dot may retry the delivery. TODO: retry policy

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
