---
id: jwt
title: Json Web Token (JWT)
sidebar_class_name: hidden
tags:
  - sdk
  - guides
---

### Technical Requirements

This document outlines a technical guide for generating a private key, using JWT for authentication, and the structure of JWT including its fields, types, and notes.

### PEM Key Pair

Before generating a private key, ensure that <a href="https://www.openssl.org" target="_blank">OpenSSL</a> is installed on your system.

To generate a 2048-bit PEM key pair, follow these steps:

1. Generate a private key:
   ```bash
   openssl genrsa -out my_key.pem 2048
   ```

2. Generate the corresponding public key using the private key:
   ```bash
   openssl rsa -in my_key.pem -pubout -out my_key.pub
   ```

You will provide us with the public key and must keep the private key secure and not share it with anyone.

---

### JWTs

All calls made to the Halo.SDK require a valid JSON Web Token (JWT). The mobile application server is expected to supply the mobile app with a JWT that can be used to authenticate with the Halo Kernel Server. The SDK requires a callback function, `onRequestJWT(callback: (String) -> Unit)`, that it will use whenever a JWT is required.

An asymmetric key is used so that the JWT can be issued (signed) by one system (mobile application server) and independently verified by another (Halo server).

---

#### Lifetime

Since the JWT essentially authorizes payment acceptance for a given merchant user, it is essential that the JWT lifetime is kept as short as possible to limit the amount of time an attacker has to crack the key itself and to limit the scope of damage in the event of a key compromise. A lifetime of 15 minutes is recommended.

---

#### Signing Public Key Format

The JWT public key should be published as a certificate in a text-friendly format, e.g., Base64 encoded PEM (.crt, .pem).

---

#### Serialization Format

The compact serialization format is expected, i.e.,

```text
urlencodedB64(header) + '.' + urlencodedB64(payload) + '.' + urlencodedB64(signature)
```

For example:

```text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2dnZWRJbkFzIjoiYWRtaW4iLCJpYXQiOjE0MjI3Nzk2Mzh9.gzSraSYS8EXBxLN_oWnFSRgCzcmJmMjLiuyu5CSpyH
```

---

#### JWT Claims

The JWT must make a number of claims - all of them standard except for `aud_fingerprints` (Audience Fingerprints).

| Field | Type        | Note                                                                                                                                                                                                                  |
|-------|-------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| alg   | String      | The signing algorithm is RSA signed SHA-256 hash, aliased as RS256. An asymmetric encryption (signing) scheme is required to allow the Kernel Server to be able to validate the token without being able to generate it. |
| sub   | String      | The Payment Processor Merchant-User ID, or Application ID                                                                                                                                                             |
| iss   | String      | This is a unique (from the perspective of Halo server) identifier for the JWT issuer, agreed upon by the JWT issuer and Synthesis, and configured in advance by Synthesis in the Halo server.                        |
| aud   | String      | URL of Halo server TLS endpoint, e.g. 'kernelserver.qa.haloplus.io'. This value should be obtained from Synthesis (different per environment) e.g. for QA it would be 'kernelserver.qa.haloplus.io' and for DEV 'kernelserver.za.dev.haloplus.io' |
| usr   | String      | The details of the user performing the transaction, typically the username used to sign into the Halo.Go Developer Portal.                                                                                            |
| iat   | NumericDate | The UTC timestamp of when the JWT was generated.                                                                                                                                                                      |
| exp   | NumericDate | The UTC timestamp of expiration of the JWT.                                                                                                                                                                                |
| aud_fingerprints | String | A CSV list of expected SHA-256 fingerprints for the Kernel Server TLS endpoint. This list may contain multiple values to support certificate rotation. In the QA environment, the expected value as of writing this would be: "sha256/zc6c97JhKPZUa+rIrVqjknDE1lDcDK77G41sDo+1ay0=" |

---

All these values can be validated by making a POST request to `https://kernelserver.qa.haloplus.io/<sdk-version>/tokens/checkjwt`. Your JWT should be added as a header (Bearer Auth).