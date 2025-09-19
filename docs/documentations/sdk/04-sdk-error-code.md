# SDK Error Codes

Possible SDK error codes you may encounter during integration.

| Error Code | Description                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------- |
| 0          | **OK** – The request completed successfully with no errors.                                       |
| 1          | **Declined** – The request was rejected by the system or provider.                                |
| 2          | **Declined Offline** – The transaction was declined while the device was offline.                 |
| 65         | **Single Tap and PIN** – User is required to tap once and provide a PIN for authentication.       |
| 100        | **Unauthorized** – Access denied due to missing or invalid credentials.                           |
| 101        | **Forbidden** – Operation not allowed; permissions are insufficient.                              |
| 102        | **Invalid API Key** – The provided API key is not valid.                                          |
| 103        | **Invalid JSON** – Request payload contains malformed JSON.                                       |
| 104        | **Invalid Request** – The request is not properly structured or is missing fields.                |
| 105        | **Blocked User** – The user account has been blocked from making requests.                        |
| 106        | **Invalid Request Signature** – Signature does not match the expected value.                      |
| 107        | **Missing Request Signature** – Required signature was not included in the request.               |
| 108        | **Missing Device Key** – No device key was provided.                                              |
| 109        | **Invalid Device Key** – The provided device key is invalid.                                      |
| 110        | **Replayed Message** – Duplicate/replayed request detected (possible attack).                     |
| 111        | **Missing Request Signing Key** – Request is missing the signing key.                             |
| 112        | **Invalid Request Signing Key** – Signing key is not valid.                                       |
| 113        | **Missing Request Encryption Key** – No encryption key was provided.                              |
| 114        | **Invalid Request Encryption Key** – Encryption key provided is invalid.                          |
| 115        | **Device Not Attested** – Device has not been verified for integrity/security.                    |
| 116        | **Device Failed Attestation** – Device integrity check failed.                                    |
| 117        | **Invalid JWT** – Provided JWT token is invalid.                                                  |
| 118        | **Expired JWT** – JWT token is expired and no longer valid.                                       |
| 119        | **ID Already Exists** – Duplicate identifier found; cannot create a new entry.                    |
| 120        | **Phone Number Not Verified** – Phone verification step is incomplete.                            |
| 121        | **Email Not Verified** – Email verification step is incomplete.                                   |
| 122        | **Data Not Found** – Requested data could not be located.                                         |
| 123        | **Transaction Does Not Belong to Merchant** – Transaction does not match the requesting merchant. |
| 124        | **Duplicate Merchant Reference** – The merchant reference already exists.                         |
| 125        | **Invalid Receipt Signature** – The receipt signature could not be validated.                     |
| 126        | **Invalid Algorithm** – Unsupported or incorrect algorithm specified.                             |
| 127        | **Invalid Site Identifier** – Site ID is invalid.                                                 |
| 128        | **Missing Site Identifier** – Site ID is missing.                                                 |
| 129        | **External Request Error** – An error occurred while calling an external service.                 |
| 130        | **Email Already Exists** – Duplicate email detected in the system.                                |
| 131        | **Phone Already Exists** – Duplicate phone number detected in the system.                         |
| 132        | **Max Login Retries Exceeded** – Too many failed login attempts.                                  |
| 133        | **Integrator Not Approved** – The integrator is not approved to use the system.                   |
| 134        | **Data Error** – General error with input or retrieved data.                                      |
| 135        | **Invalid User** – User details are invalid.                                                      |
| 136        | **Unknown Device Installation ID** – The given installation ID is not recognized.                 |
| 137        | **Unsupported Encryption Curve** – The encryption curve is not supported.                         |
| 138        | **Unsupported Secure Card Reader** – Secure card reader is not supported on this device.          |
| 139        | **Blocked Device** – Device is blocked from performing requests.                                  |

### 200 – Database & Transaction Errors

| Error Code | Description                                                                                     |
| ---------- | ----------------------------------------------------------------------------------------------- |
| 200        | **Database Integrity Failed** – Data integrity constraints were violated.                       |
| 201        | **Database Error** – A general error occurred in the database.                                  |
| 202        | **Decrypt Request Error** – The system could not decrypt the request.                           |
| 203        | **Unknown Error** – An unspecified error occurred.                                              |
| 204        | **Crypto Error** – A cryptographic operation failed.                                            |
| 205        | **DUKPT Counter Overflow** – The transaction counter for DUKPT keys has overflowed.             |
| 208        | **Invalid Payment Provider** – Payment provider details are invalid.                            |
| 209        | **Declined by Payment Provider** – Payment was explicitly rejected by the provider.             |
| 210        | **Failed to Submit to All Providers** – Request could not be submitted to any payment provider. |
| 211        | **Invalid PIN Data** – PIN information is missing or invalid.                                   |
| 212        | **Refund Too Late** – Refund request exceeds allowed time limit.                                |
| 213        | **Refund Already Processed** – The refund has already been completed.                           |
| 214        | **Missing PFS Server Key** – Required key from the PFS server is missing.                       |

### 300– Device Error Codes

| Error Code | Description                                                                           |
| ---------- | ------------------------------------------------------------------------------------- |
| 300        | **NFC Disabled** – NFC is disabled on the device.                                     |
| 301        | **Invalid System State** – The device is in an unsupported state.                     |
| 302        | **Invalid Currency** – Currency code is invalid.                                      |
| 303        | **Unsupported Android Version** – Device OS version is not supported.                 |
| 304        | **JWT Parsing Error** – JWT token could not be parsed.                                |
| 305        | **Network Error** – Network connectivity failure.                                     |
| 306        | **Missing Response Signature** – Expected response signature is not present.          |
| 307        | **Invalid Response Signature** – Response signature validation failed.                |
| 308        | **Server Requested Config Clear** – Server instructed device to clear configuration.  |
| 309        | **Deserialization Error** – Response could not be deserialized.                       |
| 310        | **SafetyNet Attestation Error** – Google SafetyNet attestation failed.                |
| 311        | **Google Play Unavailable** – Required Google Play services unavailable.              |
| 312        | **Excessive Time Drift** – Device clock drift exceeds allowed threshold.              |
| 313        | **Attestation in Progress** – Device attestation is ongoing; request cannot complete. |
| 314        | **Rooted Device** – Device is rooted and not allowed.                                 |
| 315        | **Instrumented Device** – Device shows signs of tampering/instrumentation.            |
| 316        | **Debugging Enabled** – Device is in debug mode, which is disallowed.                 |
| 317        | **Transaction Cancelled** – Transaction was cancelled by user or system.              |
| 318        | **Card Tap Timeout** – Card was not tapped within the allowed time.                   |
| 319        | **Transaction Error** – General transaction error occurred.                           |
| 320        | **TEE Attestation Error** – Trusted Execution Environment attestation failed.         |
| 321        | **Invalid PIN Key** – Validation of the PIN key failed.                               |
| 322        | **Integrity Check Failed** – Security integrity validation failed.                    |
| 323        | **Invalid NFC State** – NFC used before establishing connection.                      |
| 324        | **Failed to Import Signing Cert** – Server signing certificate import failed.         |
| 325        | **Failed to Import Encryption Key** – Server encryption key import failed.            |
| 326        | **Not Implemented** – Feature not implemented.                                        |
| 327        | **Missing Sensors** – Required hardware sensors are missing.                          |
| 328        | **Microphone Was Unmuted** – Microphone unmuted unexpectedly during operation.        |
| 329        | **Null Attestation Handle** – Attestation returned a null handle.                     |
| 330        | **Cryptography Error** – Cryptographic function failed.                               |
| 399        | **System Not Initialised** – SDK/system has not been initialized.                     |

### 400 – Configuration & Security Errors

| Error Code | Description                                                                                    |
| ---------- | ---------------------------------------------------------------------------------------------- |
| 401        | **Camera Permission Not Granted** – Camera access permission denied.                           |
| 402        | **Accessibility Service Blocks PIN** – Accessibility settings interfere with PIN entry.        |
| 403        | **Developer Options Enabled** – Device has developer options enabled, which is disallowed.     |
| 404        | **Missing Attestation Nonce** – Attestation nonce value not provided.                          |
| 405        | **Configuration Fetch Error** – Failed to retrieve configuration from server.                  |
| 406        | **Missing Entropy** – Random entropy source unavailable.                                       |
| 410        | **Invalid Transaction Reference** – Transaction reference does not match format.               |
| 411        | **Missing Secure Card Reader Implementation** – Required card reader component is not present. |
| 412        | **Failed to Get Random Bytes** – Secure random byte generation failed.                         |
| 413        | **Missing Data KEK** – Key encryption key (KEK) for data is missing.                           |
| 414        | **PIN Error** – General error occurred with PIN input/processing.                              |

### 500 – Secure Card Reader Errors

| Error Code | Description                                                                                    |
| ---------- | ---------------------------------------------------------------------------------------------- |
| 500        | **Bluetooth Connect Permission Not Granted** – Required Bluetooth connect permission missing.  |
| 501        | **Bluetooth Scan Permission Not Granted** – Required Bluetooth scan permission missing.        |
| 502        | **Bluetooth Unavailable** – Bluetooth is unavailable on the device.                            |
| 503        | **Bluetooth Scan in Progress** – A Bluetooth scan is already running.                          |
| 504        | **Bluetooth Pair Failed** – Secure card reader pairing attempt failed.                         |
| 505        | **Secure Card Reader Command Failed** – A command sent to the card reader failed.              |
| 506        | **Bluetooth Device Unavailable** – Required Bluetooth device not available.                    |
| 507        | **Secure Card Reader Timeout** – Secure card reader did not respond in time.                   |
| 508        | **Invalid Card Reader Config** – Card reader configuration is invalid.                         |
| 509        | **Bluetooth Not Enabled** – Bluetooth is turned off on the device.                             |
| 510        | **Secure Card Reader PIN Error** – Error occurred while handling PIN via reader.               |
| 511        | **Plugin Not Available for Device** – Card reader plugin not supported on this device.         |
| 512        | **Transaction Already in Progress** – A secure card reader transaction is ongoing.             |
| 513        | **Location Permission Not Granted** – Fine location permission missing for Bluetooth scanning. |
| 514        | **Bluetooth Pair Timeout** – Pairing attempt with card reader timed out.                       |
| 515        | **Key Load Error** – Failed to load encryption keys into card reader.                          |
| 516        | **Low Battery** – Secure card reader battery is too low.                                       |
| 517        | **Disconnected** – Secure card reader unexpectedly disconnected.                               |
| 518        | **Firmware Update Required** – Card reader firmware is outdated.                               |
| 519        | **Firmware Update in Progress** – Card reader firmware update is ongoing.                      |
| 520        | **Security Mechanism Disabled** – Required card reader security features are disabled.         |
| 521        | **Tamper Flag Set** – Card reader indicates physical tampering.                                |
