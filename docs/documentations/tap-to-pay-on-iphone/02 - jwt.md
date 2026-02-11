---
id: jwt
title: JSON Web Token (JWT)
tags:
  - sdk
  - guides
  - tap to pay on iphone
  - iphone
---
# JWT Integration Guide

This guide explains how clients can generate JWT tokens for authentication with our backend system using RSA-256 asymmetric cryptography.

## Overview

Our authentication system uses **RS256 (RSA-SHA256)** algorithm for JWT token signing. This is an asymmetric encryption method where:

- **Private Key**: Kept secret by the client, used to sign JWT tokens
- **Public Key**: Shared with our backend, used to verify JWT token signatures

This ensures that only you can create valid tokens, but our backend can verify their authenticity.

---

## Step 1: Generate RSA Key Pair

You need to generate a 2048-bit RSA key pair. This can be done using OpenSSL, which is available on most systems.

### Using OpenSSL (Recommended)

#### Option A: Generate Both Keys at Once

```bash
# Generate private key (2048-bit RSA)
openssl genrsa -out jwt_private_key.pem 2048

# Extract public key from private key
openssl rsa -in jwt_private_key.pem -pubout -out jwt_public_key.pem
```

### Expected Output Format

**Private Key** (`jwt_private_key.pem`):

```
-----BEGIN PRIVATE KEY-----
**********
...
-----END PRIVATE KEY-----
```

**Public Key** (`jwt_public_key.pem`):

```
-----BEGIN PUBLIC KEY-----
**********
...
-----END PUBLIC KEY-----
```

---

## Step 2: Share Public Key with Backend

You must provide your **public key** to our backend team so we can verify your JWT tokens.

### How to Send the Public Key

1. **Copy the entire public key** including the header and footer:

   ```bash
   cat jwt_public_key.pem
   ```

2. **Send via secure channel**:
   - Email to: ``
   - Support ticket with subject: "JWT Public Key Submission - [Your Company Name]"

3. **Include the following information**:

   ```
   Company Name: [Your Company Name]
   Environment:

   Public Key:
   -----BEGIN PUBLIC KEY-----
   [Your public key content here]
   -----END PUBLIC KEY-----
   ```

### Important Notes

- **NEVER share your private key** with anyone, including our backend team
- The public key is safe to share and will be stored in our system
- You will receive a confirmation email once your public key is registered
- Different environments (dev/qa/production) require separate key pairs

---

## Step 3: JWT Libraries for Your Technology Stack

You'll need a JWT library that supports RS256 (RSA-SHA256) signing. Most programming languages have well-maintained JWT libraries:

### Popular JWT Libraries

- **Node.js**: `jsonwebtoken`, `jose`
- **Python**: `PyJWT`, `python-jose`
- **Java**: `jjwt`, `java-jwt`
- **Go**: `golang-jwt/jwt`, `go-jose`
- **PHP**: `firebase/php-jwt`, `lcobucci/jwt`
- **.NET/C#**: `System.IdentityModel.Tokens.Jwt`, `jose-jwt`
- **Ruby**: `ruby-jwt`
- **Rust**: `jsonwebtoken`

Choose the library that's most commonly used in your technology stack and ensure it supports the RS256 algorithm.

---

## Step 4: JWT Payload Structure

Your JWT token must include the following claims in the payload. Use your JWT library to create and sign a token with this structure:

### Required Claims

```json
{
  "iss": "your company identifier",
  "sub": "Merchant ID",
  "usr": "user ID",
  "iat": 1707580800, // Created at
  "exp": 1707667200, // time of expiring in seconds
  "refresh_token": false,
  "x-tid": "Terminal ID",
  "mcc": "Merchant Category Code",
  "mbn": "Your Business Name",
  "tpid": "Transacation Provider ID"
}
```

### Implementation Requirements

1. **Load your private key** from the PEM file you generated in Step 1
2. **Create the payload** with the required claims (see table in Appendix)
3. **Sign the token** using the **RS256 algorithm** with your private key
4. **Set expiration**: Use Unix timestamp format (seconds since epoch)

### Critical Points

- Algorithm MUST be **RS256** (RSA-SHA256)
- Token header should be: `{"alg": "RS256", "typ": "JWT"}`
- All timestamps (`iat`, `exp`) must be Unix timestamps (seconds, not milliseconds)
- The `sub` and `usr` fields must always be available or have the same value
- Remove any fields that are `null` or `undefined` before signing

---

## Step 5: Generate and Use Tokens

### Token Generation Process

1. **Load your private key** from the secure location where you stored it
2. **Construct the payload** with all required claims
3. **Use your JWT library** to sign the payload with RS256 algorithm
4. **The library will automatically**:
   - Create the JWT header
   - Encode the payload
   - Sign with your private key
   - Return a complete JWT token in format: `header.payload.signature`

### Use Token when calling the SDK

Include the JWT token in the initialisation message to the SDK:

```swift
do {
    let capabilities = try HaloSDK.initialize(
        authToken: "your_auth_token",
        environment: .sandbox
    )
    print("Device can accept payments: \(capabilities.canAcceptPayments)")
} catch HaloError.deviceNotSupported(let reason) {
    // Handle unsupported device
} catch {
    // Handle other errors
}
```

---

## Security Best Practices

### Private Key Security

1. **Never commit private keys to version control**

   ```bash
   # Add to .gitignore
   echo "jwt_private_key.pem" >> .gitignore
   echo "*.pem" >> .gitignore
   echo "*.key" >> .gitignore
   ```

2. **Use environment variables** for production:

   ```javascript
   // Instead of reading from file in production
   const privateKey = process.env.JWT_PRIVATE_KEY;
   ```

3. **Restrict file permissions**:

   ```bash
   chmod 600 jwt_private_key.pem
   ```

4. **Store securely**:
   - Use secret management services (AWS Secrets Manager, HashiCorp Vault, etc.)
   - Encrypt at rest
   - Never share via email/Slack/unsecured channels

### Token Security

1. **Set appropriate expiration times**:
   - Never use tokens that don't expire

2. **Use HTTPS only**:
   - Never send tokens over unencrypted HTTP
   - Always use TLS/SSL for API communication

3. **Implement token refresh**:
   - Use refresh tokens for long-lived sessions
   - Rotate tokens regularly

4. **Validate on backend**:
   - Our backend will verify the signature using your public key
   - Expired tokens will be rejected
   - Malformed tokens will be rejected
