# Halo Dot Adaptor Bootstrapping Guide

## Overview

After deploying the Halo Dot Adaptor, you must bootstrap the installation to initialize the database
with required configuration values. The bootstrapping process sets up essential payment processing
parameters, terminal configurations, and security settings that enable the Adaptor to process
SoftPOS transactions.

This guide walks you through running the Halo Dot bootstrapper, which is provided as a Helm chart
for simplified deployment.

## Prerequisites

Before bootstrapping, ensure:

1. **Adaptor Deployment Complete**: The Halo Dot Adaptor must be successfully deployed and running
1. **Network Connectivity**: The bootstrapper must be able to reach the Adaptor service
1. **JWT Public Key Ready**: You'll need your JWT public key for SDK authentication
1. **Helm 3.x**: Installed on your local machine

## Bootstrapping Process

### Step 1: Add the Halo Dot Helm Repository

If you haven't already added the repository during Adaptor installation:

```bash
helm repo add halodot https://halo-dot.github.io/helm-charts
helm repo update
```

### Step 2: Prepare Configuration File

Create a `config.yaml` file with your configuration:

```yaml
# Basic bootstrapper configuration
bootstrap:
  # Terminal configuration
  terminalCurrencyCode: "0840"  # USD (ISO 4217)
  encryptTags: "57,5A"  # Standard EMV tags for encryption
  
  paymentProvider:
    url: "http://paymentprovider.halo.svc.cluster.local"
  
  # JWT configuration for SDK authentication
  jwt:
    issuerName: "softpos-api.yourdomain.com"
    key: |
      -----BEGIN PUBLIC KEY-----
      <your-jwt-public-key>
      -----END PUBLIC KEY-----
  
  image:
    repository: <provided-repository>
    tag: <provided-version>
    pullPolicy: Always

# Adaptor connection configuration
adaptor:
  url: "https://adaptor.halo.svc.cluster.local" # set to https://adaptor.halo.svc.cluster.local if TLS is disabled
  namespace: "halo"
  currentPassword: "password"  # Default password
  newPassword: "<strong-password>"  # Set a strong password

# Image pull secret configuration (if using private registry)
imageCredentials:
  enabled: true
  registry: "<provided-registry>"
  username: "<provided-username>"
  email: "ops@yourcompany.com"
  password: "<registry-password>"
```


### Step 3: Configure Terminal Configuration Overrides (Optional)

If you need to customize terminal configuration, add the
`configOverride` section:

```yaml
bootstrap:
  configOverride:
    - aid: "A0000000031010"  # Visa
      kernelID: 3
      transactionTypeConfigs:
        - transactionType: "00"  # Purchase
          tlvDatabase:
            - tag: "9F33"  # Terminal Capabilities
              value: "E0F8C8"
            - tag: "9F35"  # Terminal Type
              value: "22"
    - aid: "A0000000041010"  # Mastercard
      kernelID: 2
      transactionTypeConfigs:
        - transactionType: "00"
          tlvDatabase:
            - tag: "9F33"
              value: "E0F8C8"
```

### Step 4: Run the Bootstrapper

Execute the bootstrapping job:

```bash
helm install bootstrapper halodot/halo-adaptor-bootstrapper \
  --values config.yaml \
  --namespace halo \
  --wait
```

### Step 5: Verify Bootstrapping Success

1. **Check job completion**:

   ```bash
   kubectl get jobs -n halo
   # Should show bootstrapper job as "Completed"
   ```

1. **Review bootstrapper logs**:

   ```bash
   kubectl logs -n halo job/bootstrap
   ```

### Step 6: Clean Up

Once bootstrapping is successful, remove the bootstrapper:

```bash
helm uninstall bootstrapper -n halo
```

## Configuration Reference

### Currency Codes

Common ISO 4217 currency codes for `terminalCurrencyCode`. 
A full list can be found [here](https://en.wikipedia.org/wiki/ISO_4217):

| Currency | Code | Numeric | 
|----------|------|---------| 
| US Dollar | USD | 0840 | 
| Euro | EUR | 0978 | 
| British Pound | GBP | 0826 | 
| South African Rand | ZAR | 0710 | 
| Australian Dollar | AUD | 0036 | 
| Canadian Dollar | CAD | 0124 |

### EMV Tags for Encryption

The `encryptTags` parameter specifies which EMV tags should be encrypted. Common sensitive tags:

- `57` - Track 2 Equivalent Data
- `5A` - Primary Account Number (PAN)
- `5F20` - Cardholder Name
- `5F24` - Application Expiration Date

### Terminal Configuration Overrides

The `configOverride` array allows customization per card application (AID):

```yaml
configOverride:
  - aid: "<application-identifier>"
    kernelID: <kernel-number>
    transactionTypeConfigs:
      - transactionType: "<type-code>"
        tlvDatabase:
          - tag: "<emv-tag>"
            value: "<hex-value>"
```

Common transaction types:

- `00` - Purchase
- `20` - Refund

## Post-Bootstrapping Steps

### Provide JWT Configuration to Halo Dot

After successful bootstrapping, provide Halo Dot support with:

1. **JWT Issuer Name**: The value from `bootstrap.jwt.issuerName`
1. **JWT Public Key**: The key configured in `bootstrap.jwt.key`

## Troubleshooting

### Bootstrapper Job Fails

**Check logs**:

```bash
kubectl logs -n halo job/bootstrap
```

**Common issues**:

- **Connection refused**: Verify Adaptor service is running and accessible
- **Authentication failed**: Check admin credentials in config.yaml
- **Invalid configuration**: Validate YAML syntax and required fields

### Configuration Not Applied

If configuration doesn't appear to take effect:

1. **Check Adaptor logs**:

   ```bash
   kubectl logs -n halo -l app=adaptor --tail=100
   ```

1. **Re-run bootstrapper** if needed:

   ```bash
   helm upgrade bootstrapper halodot/halo-adaptor-bootstrapper \
     --values config.yaml \
     --namespace halo
   ```

### JWT Validation Errors

If SDK authentication fails after bootstrapping:

1. **Verify public key format**: Ensure PEM format with proper headers
1. **Check issuer name**: Must match exactly what's configured in your SDK
1. **Validate key pair**: Ensure public key matches the private key used for signing

## Security Considerations

   - Bootstrapper only needs internal cluster access
   - No external network access required
   - Remove bootstrapper after completion

## Re-running Bootstrapping

The bootstrapper can be run multiple times if you need to:

- Update terminal configuration
- Change payment provider settings
- Modify JWT configuration
- Reset admin credentials

To re-run:

```bash
helm upgrade --install bootstrapper halodot/halo-adaptor-bootstrapper \
  --values config.yaml \
  --namespace halo \
  --wait
```

If installing fails, first remove the boostrapper:

```bash
helm uninstall bootstrapper -n halo
```

Then reinstall the boostrapper

```bash
helm upgrade --install bootstrapper halodot/halo-adaptor-bootstrapper \
  --values config.yaml \
  --namespace halo \
  --wait
```

## Next Steps

After successful bootstrapping:

1. **Complete JWT setup** with Halo Dot support
1. **Configure monitoring** for the Adaptor
1. **Set up your SoftPOS applications** to connect to the Adaptor
1. **Perform end-to-end testing** with test cards
1. **Plan for production deployment** including security hardening

For additional support, contact Halo Dot with:

- Bootstrapper logs
- Configuration files (sanitized)
- Your issuer name

## Helm values 


| Parameter | Description | Default |
|-----------|-------------|---------|
| `adaptor.namespace` | Set this to the namespace of the halo adaptor | `halo` |
| `adaptor.url` | Set this to the URL of the adaptor's service | `http://adaptor` |
| `adaptor.username` | Set this to the current admin username | `admin` |
| `adaptor.currentPassword` | Set this to the current admin password, you do not necessarily need to update this  value, if the password is changed the bootstrapper will use the newPassword to login, sensitive | `password` |
| `adaptor.newPassword` | Set this to a new admin password if you want to change the admin password, required and sensitive | `null` |
| `bootstrap.name` | Name of the boostrap job | `bootstrap` |
| `bootstrap.image.repository` | Image repository for the bootstrap image, required | `null` |
| `bootstrap.image.tag` | Tag for the bootstrap image, this overrides the version setting | `latest` |
| `bootstrap.acquirer.name` | Name of the "Acquirer" (Acquirer is the Halo term for an App) | `Acquirer` |
| `bootstrap.acquirer.alias` | Alias of the "Acquirer" (Acquirer is the Halo term for an App) | `Acquirer` |
| `bootstrap.jwt.issuerName` | Name for the iss field of the JWT you will issue to the SDK to authenticate your  users to the Adaptor | `jwtIssuer` |
| `bootstrap.jwt.key` | Public key used to validate the JWTs, required | `null` |
| `bootstrap.terminalCurrencyCode` | Terminal currency code to set the terminal to | `0710` |
| `bootstrap.encryptTags` | Tags which must be encrypted by the terminal | `57,5A` |
| `bootstrap.backoffLimit` | How many times the bootstrap job must try to run before failing | `1` |
| `bootstrap.configOverride` | Terminal config overrides, these must be set to override the default terminal config  [see example 1](#bootstrap-configoverride-example-1).   To remove a config override, add `"remove": true` to the config override object [see example 2](#bootstrap-configoverride-example-2). | `[]` |
| `bootstrap.caPublicKeyOverride` | CA public keys overrides, these must be set to override the default CA public keys  format for CA public keys overrides  [see example 1](#bootstrap-capublickeyoverride-example-1). | `[]` |
| `bootstrap.paymentProvider.name` | Name of the paymentprovider, can be left as default | `PaymentProvider` |
| `bootstrap.paymentProvider.url` | URL of the paymentprovider service | `http://paymentprovider` |
| `imageCredentials.enabled` | Enables using private registries with authentication | `false` |
| `imageCredentials.registry` | Sets the URL for the private registry to login to | `quay.io` |
| `imageCredentials.username` | Sets the username for logging into the private registry | `someone` |
| `imageCredentials.password` | Sets the password for logging into the private registry, sensitive | `sillyness` |
| `imageCredentials.email` | Sets the email address for logging into the private registry | `someone@host.com` |

## Code Examples

### Examples for `bootstrap.configOverride`

<a id="bootstrap-configoverride-example-1"></a>
**Example 1:**
```yaml title="Format for configOverride"
 - aid: A0000000031010
   kernelID: 3
   transactionTypeConfigs:
     - transactionType: "00"
       tlvDatabase:
         - tag: "9F33"
           value: "200808"
```

<a id="bootstrap-configoverride-example-2"></a>
**Example 2:**
```yaml title="Format for configOverride with remove"
 # Example to remove an AID:
 - aid: A0000000031010
   remove: true

 # Example to remove a transaction type config:
 - aid: A0000000031010
   kernelID: 3
   transactionTypeConfigs:
     - transactionType: "00"
       remove: true

 # Example to remove a TLV tag:
 - aid: A0000000031010
   kernelID: 3
   transactionTypeConfigs:
   - transactionType: "00"
     tlvDatabase:
       - tag: "9F33"
         remove: true
```

### Examples for `bootstrap.caPublicKeyOverride`

<a id="bootstrap-capublickeyoverride-example-1"></a>
**Example 1:**
```yaml title="Format for caPublicKeyOverride"
 - hexRID: A000000025
   hexRIDIndex: 01
   remove: true

 - hexRID: <hexRID>
   hexRIDIndex: <hexRIDIndex>
   keyLengthInBits: <keyLengthInBits>
   hexExponent: <hexExponent>
   hexModulus: <hexModulus>
   hexHashSha1: <hexHashSha1>

 - hexRID: A000000025
   hexRIDIndex: 02
   keyLengthInBits: 896
   hexExponent: 03
   hexModulus: AF4B8D230FDFCB1538E975795A1DB40C396A5359FAA31AE095CB522A5C82E7FFFB252860EC2833EC3D4A665F133DD934EE1148D81E2B7E03F92995DDF7EB7C90A75AB98E69C92EC91A533B21E1C4918B43AFED5780DE13A32BBD37EBC384FA3DD1A453E327C56024DACAEA74AA052C4D
   hexHashSha1: 33F5B0344943048237EC89B275A95569718AEE20
```

