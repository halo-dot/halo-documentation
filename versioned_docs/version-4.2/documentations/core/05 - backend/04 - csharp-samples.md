---
description: >-
  C# samples for a .NET 8 backend: parsing and verifying transaction data and
  attestation tokens.
---

# C# samples

These samples parse and verify [transaction data](/docs/4.2/documentations/core/backend/transaction-data) and [attestation tokens](/docs/4.2/documentations/core/backend/attestation-token) in a .NET 8 backend, in the order each page's Verifying section gives. A failed check throws `HaloVerificationException`.

They don't decrypt anything: decrypting card data and PIN blocks is separate. See [Decrypting](/docs/4.2/documentations/core/backend/transaction-data#decrypting).

## Project setup

Save the two schemas, from [transaction data](/docs/4.2/documentations/core/backend/transaction-data#schema) and [attestation tokens](/docs/4.2/documentations/core/backend/attestation-token#schema), as `Protos/transaction_data.proto` and `Protos/attestation_token.proto`. Grpc.Tools generates their classes at build time.

```xml title="HaloBackend.csproj"
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Google.Protobuf" Version="3.28.3" />
    <PackageReference Include="Grpc.Tools" Version="2.67.0" PrivateAssets="All" />
  </ItemGroup>

  <ItemGroup>
    <Protobuf Include="Protos/*.proto" GrpcServices="None" />
  </ItemGroup>

</Project>
```

:::note
In C#, the `descriptor` field is `Descriptor_`: protoc renames it because the generated classes already have a `Descriptor` property.
:::

## Envelope parsing

Both objects share one [layout](/docs/4.2/documentations/core/backend/transaction-data#layout). `Split` checks only the lengths. `Decode` checks the version byte, so each verifier calls it at the step its page gives.

```csharp title="HaloEnvelope.cs"
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using Google.Protobuf;

namespace HaloDot.Verification;

public sealed class HaloVerificationException(string message) : Exception(message);

// [varint signature length][signature][version][protobuf], shared by
// transaction data and attestation tokens.
public sealed class HaloEnvelope
{
    public const byte SupportedVersion = 1;

    // A DER ECDSA P-256 signature is at most 72 bytes.
    private const int MaxSignatureLength = 72;

    private readonly byte[] _signature;
    private readonly byte[] _signed; // the version byte and the protobuf, exactly as received

    private HaloEnvelope(byte[] signature, byte[] signed) =>
        (_signature, _signed) = (signature, signed);

    // Splits the envelope. Checks lengths only: the version byte is checked
    // by Decode, at the point in the verification order each page gives.
    public static HaloEnvelope Split(ReadOnlySpan<byte> data)
    {
        // The length is a varint, but anything up to 72 is a single byte: a
        // byte over 72, continuation bit included, is out of range.
        if (data.IsEmpty) throw new HaloVerificationException("Truncated envelope.");
        int length = data[0];
        if (length is 0 or > MaxSignatureLength)
            throw new HaloVerificationException("Signature length is out of range.");
        // The signature, then at least the version byte.
        if (data.Length < 1 + length + 1)
            throw new HaloVerificationException("Truncated envelope.");

        return new HaloEnvelope(data.Slice(1, length).ToArray(), data[(1 + length)..].ToArray());
    }

    // ECDSA-SHA256 over the version byte and the protobuf.
    public void VerifySignature(X509Certificate2 signer)
    {
        using var key = signer.GetECDsaPublicKey()
            ?? throw new HaloVerificationException("The signer's key isn't an ECDSA key.");
        if (!key.VerifyData(_signed, _signature, HashAlgorithmName.SHA256, DSASignatureFormat.Rfc3279DerSequence))
            throw new HaloVerificationException("The signature doesn't verify.");
    }

    // Checks the version byte, then decodes the protobuf.
    public T Decode<T>(MessageParser<T> parser) where T : IMessage<T>
    {
        if (_signed[0] != SupportedVersion)
            throw new HaloVerificationException($"Unsupported version {_signed[0]}.");
        try
        {
            return parser.ParseFrom(_signed, 1, _signed.Length - 1);
        }
        catch (InvalidProtocolBufferException e)
        {
            throw new HaloVerificationException($"Malformed protobuf: {e.Message}");
        }
    }
}
```

## Attestation token verification

A token that verifies is returned whatever its verdict. A token from a `PinAttestationFailed` result verifies with verdict `FAIL`: [look it up](/docs/4.2/documentations/core/backend/attestation-token#looking-up-an-attestation-result) to find out why.

```csharp title="AttestationTokenVerifier.cs"
using System.Security.Cryptography.X509Certificates;
using Halo.AttestationToken.V1;

namespace HaloDot.Verification;

public sealed class AttestationTokenVerifier(ISignerChainSource chains, X509Certificate2 haloDotRoot)
{
    public const string Descriptor = "halo attestation-token";

    // Returns the token once it verifies, pass or fail: check its verdict.
    public async Task<AttestationToken> VerifyAsync(byte[] signedToken)
    {
        var envelope = HaloEnvelope.Split(signedToken);

        // 1. The version byte, then decode. Nothing in the token is trusted
        //    until step 5: only descriptor and signer_serial are read before it.
        var token = envelope.Decode(AttestationToken.Parser);

        // 2. The descriptor. protoc names the field Descriptor_, since
        //    Descriptor is taken by the message's own descriptor.
        if (token.Descriptor_ != Descriptor)
            throw new HaloVerificationException("Not an attestation token.");

        // 3. The signer's chain, for signer_serial.
        var chain = await chains.GetChainAsync(token.SignerSerial.ToByteArray());

        // 4. Validate it up to the Halo Dot root. Its leaf must be the signer
        //    the token names.
        using var signer = HaloChain.Validate(chain, haloDotRoot);
        HaloChain.RequireSerial(signer, token.SignerSerial.Span);

        // 5. The signature.
        envelope.VerifySignature(signer);

        // VERDICT_UNSPECIFIED is never issued. Neither is any value the
        // schema doesn't list.
        if (token.Verdict is not (Verdict.Pass or Verdict.Fail))
            throw new HaloVerificationException($"Invalid verdict {token.Verdict}.");

        return token;
    }
}
```

## Transaction data verification

`TransactionDataVerifier` verifies the embedded attestation token with `AttestationTokenVerifier`.

```csharp title="TransactionDataVerifier.cs"
using System.Security.Cryptography.X509Certificates;
using Halo.AttestationToken.V1;
using Halo.TransactionData.V1;

namespace HaloDot.Verification;

public sealed class TransactionDataVerifier(AttestationTokenVerifier tokens, X509Certificate2 haloDotRoot)
{
    public const string Descriptor = "halo transaction-data";

    // signingChain: the OnlineRequest's signing chain, as your app received it.
    // receivedAt: when the transaction data reached your backend.
    public async Task<TransactionData> VerifyAsync(
        byte[] signedData, IReadOnlyList<byte[]> signingChain, DateTimeOffset receivedAt)
    {
        var envelope = HaloEnvelope.Split(signedData);

        // 1. The signing chain, from the device signing certificate up to the
        //    Halo Dot root.
        using var device = HaloChain.Validate(signingChain, haloDotRoot);

        // 2. The signature over the version byte and the protobuf.
        envelope.VerifySignature(device);

        // 3. The version byte, then decode. The descriptor first, then
        //    signing_serial.
        var data = envelope.Decode(TransactionData.Parser);
        if (data.Descriptor_ != Descriptor)
            throw new HaloVerificationException("Not transaction data.");
        HaloChain.RequireSerial(device, data.SigningSerial.Span);

        // 4. The attestation token: it verifies, passed, names this device,
        //    and hadn't expired when the data arrived.
        var token = await tokens.VerifyAsync(data.AttestationToken.ToByteArray());
        if (token.Verdict != Verdict.Pass)
            throw new HaloVerificationException("The attestation didn't pass.");
        if (token.DeviceSigningSerial != data.SigningSerial)
            throw new HaloVerificationException("The attestation token names another device.");
        // Expired at expires_at_unix itself, as with a JWT's exp.
        if (receivedAt.ToUnixTimeSeconds() >= token.ExpiresAtUnix)
            throw new HaloVerificationException("The attestation token had expired.");

        // 5. With a PIN block, the token must name this transaction. Without
        //    one, the token's transaction_id is ignored.
        if (!data.PinBlock.IsEmpty && token.TransactionId != data.TransactionId)
            throw new HaloVerificationException("The attestation token names another transaction.");

        // 6. Deduplicating on transaction_id is left to you: see below.
        return data;
    }
}
```

Putting it together, where `YourSignerChainSource` is your [signer chain source](#the-signer-chain-source):

```csharp
var haloDotRoot = new X509Certificate2("halo-dot-root.cer"); // the Halo Dot root you pin
var tokens = new AttestationTokenVerifier(new CachingSignerChainSource(new YourSignerChainSource()), haloDotRoot);
var transactions = new TransactionDataVerifier(tokens, haloDotRoot);

var data = await transactions.VerifyAsync(signedData, signingChain, DateTimeOffset.UtcNow);
```

Step 6 needs your own storage: accept a `transaction_id` at most twice, once without a PIN block and then once with one (a [PIN continuation](/docs/4.2/documentations/core/transactions#pin-continuation)). Act on the transaction data only after that.

## The signer chain source

An attestation token names its signer in `signer_serial`. Get that signer's chain from Halo Dot (TODO: endpoint) behind `ISignerChainSource`, and wrap it in `CachingSignerChainSource` to cache it per serial.

```csharp title="SignerChainSource.cs"
using System.Collections.Concurrent;

namespace HaloDot.Verification;

public interface ISignerChainSource
{
    // The certificate chain of the Halo Dot signer with this serial: DER,
    // the signer's certificate first.
    Task<IReadOnlyList<byte[]>> GetChainAsync(byte[] signerSerial);
}

// Fetches each signer's chain once. It caches the chain, not the result of
// validating it: chains are validated on every use.
public sealed class CachingSignerChainSource(ISignerChainSource inner) : ISignerChainSource
{
    private readonly ConcurrentDictionary<string, Task<IReadOnlyList<byte[]>>> _chains = new();

    public async Task<IReadOnlyList<byte[]>> GetChainAsync(byte[] signerSerial)
    {
        var key = Convert.ToHexString(signerSerial);
        var fetch = _chains.GetOrAdd(key, _ => inner.GetChainAsync(signerSerial));
        try
        {
            return await fetch;
        }
        catch
        {
            _chains.TryRemove(new(key, fetch)); // don't cache a failed fetch
            throw;
        }
    }
}
```

`HaloChain` validates a chain up to the Halo Dot root you pin: the signer's chain, and the device signing chain from the `OnlineRequest`.

```csharp title="HaloChain.cs"
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;

namespace HaloDot.Verification;

public static class HaloChain
{
    // Validates DER certificates, leaf first, up to the Halo Dot root you
    // pin. Returns the leaf.
    public static X509Certificate2 Validate(IReadOnlyList<byte[]> chainDer, X509Certificate2 haloDotRoot)
    {
        if (chainDer.Count == 0) throw new HaloVerificationException("Empty certificate chain.");

        using var chain = new X509Chain();
        chain.ChainPolicy.TrustMode = X509ChainTrustMode.CustomRootTrust; // only the pinned root, not the OS store
        chain.ChainPolicy.CustomTrustStore.Add(haloDotRoot);
        // Chain validation only; Halo Dot doesn't use revocation for these certificates.
        chain.ChainPolicy.RevocationMode = X509RevocationMode.NoCheck;
        chain.ChainPolicy.DisableCertificateDownloads = true;             // no fetching missing issuers

        var leaf = Load(chainDer[0]);
        foreach (var der in chainDer.Skip(1))
            chain.ChainPolicy.ExtraStore.Add(Load(der));

        if (!chain.Build(leaf))
        {
            var status = string.Join(", ", chain.ChainStatus.Select(s => s.Status));
            leaf.Dispose();
            throw new HaloVerificationException($"The certificate chain doesn't validate: {status}.");
        }
        return leaf;
    }

    // Serials in the protobufs are the certificate's serial number, raw
    // big-endian bytes as encoded in the certificate.
    public static void RequireSerial(X509Certificate2 cert, ReadOnlySpan<byte> serial)
    {
        if (!cert.SerialNumberBytes.Span.SequenceEqual(serial))
            throw new HaloVerificationException("The certificate's serial doesn't match.");
    }

    private static X509Certificate2 Load(byte[] der)
    {
        try { return new X509Certificate2(der); }
        catch (CryptographicException) { throw new HaloVerificationException("Malformed certificate."); }
    }
}
```
