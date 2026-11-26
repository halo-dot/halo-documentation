---
description: >-
  The JSON Web Token your backend issues for Halo.SDK: signing keys, claims,
  and how your app supplies it.
sidebar_position: 2.2
---

# JSON Web Token (JWT)

Halo.SDK authenticates every call it makes to Halo Dot with a JSON Web Token (JWT) that your backend issues and signs.

- **Who is transacting.** The token names your organisation (the issuer) and the user. Halo Dot checks its signature with the public key you registered.
- **Where to connect.** Halo.SDK reads the Halo Dot server address and its TLS certificate pins from the token, so one app build can point at test or production by the token alone.
- **When it's used.** Halo.SDK asks your app for a token when it initialises and again for each call to Halo Dot. Your app gets it from your backend.

## Issuing tokens from your backend

Your backend signs tokens with **RS512** (RSA with SHA-512), using a private key only it holds. Tokens signed with any other algorithm, including RS256, are rejected.

1. **Generate a key pair**, one per environment:

    ```bash
    openssl genrsa -out jwt_private_key.pem 3072
    openssl rsa -in jwt_private_key.pem -pubout -out jwt_public_key.pem
    ```

2. **Register the public key** (`jwt_public_key.pem`) with your Halo Dot contact, with your issuer name and the environment. Never share the private key, with Halo Dot or anyone else.
3. **Sign tokens** with any JWT library that supports RS512. The header is `{"alg": "RS512", "typ": "JWT"}`.

**Rotating keys.** Halo Dot accepts tokens signed by either of your two most recently registered keys. To rotate, register the new public key, switch your backend to the new private key, then retire the old one. Registering a third key retires the oldest.

Keep the private key in a secret manager, never in source control or the app.

## Claims

| Claim | Type | Required | Meaning |
| --- | --- | --- | --- |
| `iss` | String | Yes | Your issuer name, agreed with Halo Dot. It selects the public keys the signature is checked against |
| `sub` | UUID string | Yes | The user transacting, as a UUID you assign |
| `exp` | Unix seconds | Yes | When the token expires. Expired tokens are rejected |
| `iat` | Unix seconds | Recommended | When the token was issued |
| `aud` | String | Yes | The Halo Dot server for the environment, such as `coreserver.pxp.dev.haloplus.io`, with or without `https://`. Halo Dot gives you the value per environment |
| `aud_fingerprints` | String | Yes | The Halo Dot server's TLS certificate pins: comma-separated `sha256/<base64>` values. List more than one to cover a certificate rotation. Halo Dot gives you the values per environment |

All timestamps are Unix seconds, not milliseconds. Leave out claims you don't set rather than sending them as `null`.

## Giving tokens to Halo.SDK

Your app supplies tokens through a callback that Halo.SDK calls whenever it needs one: once when it initialises, then for each call to Halo Dot. In .NET this is `GetToken` in `UseHalo()`; see [Halo.SDK for .NET MAUI](/docs/4.2/documentations/core/maui).

- **Cache the token in your app** and return the cached one until it nears `exp`, so a call to Halo Dot doesn't wait on your backend.
- **Fetch a new one before it expires.** A short lifetime limits what a leaked token is worth; choose one that suits your sessions.
- **If your callback fails**, Halo.SDK gets no usable token: initialisation fails, and calls to Halo Dot are rejected until a valid token comes back.
- **Only your backend signs tokens.** The app never holds the private key.

## Example

A decoded token:

```json
{ "alg": "RS512", "typ": "JWT" }
{
  "iss": "your-issuer-name",
  "sub": "0b7c3a52-6f1e-4d8b-9a2c-5e4f3d2c1b0a",
  "iat": 1795600000,
  "exp": 1795603600,
  "aud": "coreserver.pxp.dev.haloplus.io",
  "aud_fingerprints": "sha256/AAAA…=,sha256/BBBB…="
}
```

Signing it in .NET (`System.IdentityModel.Tokens.Jwt`):

```csharp
using var rsa = RSA.Create();
rsa.ImportFromPem(File.ReadAllText("jwt_private_key.pem"));
var credentials = new SigningCredentials(new RsaSecurityKey(rsa), SecurityAlgorithms.RsaSha512);

var now = DateTimeOffset.UtcNow;
var payload = new JwtPayload
{
    { "iss", "your-issuer-name" },
    { "sub", userId.ToString() },
    { "iat", now.ToUnixTimeSeconds() },
    { "exp", now.AddHours(1).ToUnixTimeSeconds() },
    { "aud", "coreserver.pxp.dev.haloplus.io" },
    { "aud_fingerprints", "sha256/AAAA…=,sha256/BBBB…=" },
};

var token = new JwtSecurityTokenHandler()
    .WriteToken(new JwtSecurityToken(new JwtHeader(credentials), payload));
```

### Checking a token

To check a token before it goes to your app, send it to the Halo Dot server named in its `aud`:

```bash
curl -X POST "https://coreserver.pxp.dev.haloplus.io/tokens/checkjwt" \
  -H "Authorization: Bearer <token>"
```

`200` means Halo Dot accepts it: the signature, `iss`, `sub` and `exp` all check out. `401` means it doesn't. The check doesn't cover `aud` or `aud_fingerprints`, which Halo.SDK checks itself when it connects.
