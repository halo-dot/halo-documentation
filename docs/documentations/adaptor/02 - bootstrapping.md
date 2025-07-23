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

### Step 2: Prepare Configuration Files

The bootstrapper requires the configuration file:

#### config.yaml

Create a `config.yaml` file with your configuration:

```yaml
# Basic bootstrapper configuration
bootstrap:
  # Acquirer configuration (your app identity)
  acquirer:
    name: "YourCompanyName"
    alias: "YourCompanyAlias"
  
  # Terminal configuration
  terminalCurrencyCode: "0840"  # USD (ISO 4217)
  encryptTags: "57,5A"  # Standard EMV tags for encryption
  
  # Payment provider configuration
  paymentProvider:
    name: "PaymentProvider"
    url: "http://paymentprovider.halo.svc.cluster.local"
  
  # JWT configuration for SDK authentication
  jwt:
    issuerName: "softpos-api.yourdomain.com"
    key: |
      -----BEGIN PUBLIC KEY-----
      MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
      <your-jwt-public-key>
      ...
      -----END PUBLIC KEY-----
  
  # Job configuration
  name: "bootstrap"
  backoffLimit: 3  # Number of retries before failing
  
  image:
    repository: <provided-repository>
    tag: <provided-version>
    pullPolicy: Always

# Adaptor connection configuration
adaptor:
  url: "http://adaptor.halo.svc.cluster.local"
  namespace: "halo"
  username: "admin"

# Image pull secret configuration (if using private registry)
imageCredentials:
  enabled: true
  registry: "<provided-registry>"
  username: "<provided-username>"
  email: "ops@yourcompany.com"
```

#### secrets.yaml - Sensitive Configuration

Create a `secrets.yaml` file with sensitive values:

```yaml
# Adaptor admin credentials
adaptor:
  currentPassword: "password"  # Default password
  newPassword: "<strong-password>"  # Set a strong password

# Image registry password
imageCredentials:
  password: "<registry-password>"
```

**Security Best Practice**: Encrypt `secrets.yaml` using a tool like
[SOPS](https://github.com/getsops/sops) or [Sealed Secrets](https://sealed-secrets.netlify.app/):

```bash
# Example using SOPS with AWS KMS
sops --encrypt --kms arn:aws:kms:region:account:key/key-id secrets.yaml > secrets.enc.yaml
```

### Step 3: Configure Terminal Overrides (Optional)

If you need to customize terminal behaviour for specific card applications (AIDs), add the
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
# If using encrypted secrets
sops -d secrets.enc.yaml > /tmp/secrets.yaml
helm install bootstrapper halodot/halo-adaptor-bootstrapper \
  --values config.yaml \
  --values /tmp/secrets.yaml \
  --namespace halo \
  --wait
rm /tmp/secrets.yaml

# If using plain secrets (not recommended for production)
helm install bootstrapper halodot/halo-adaptor-bootstrapper \
  --values config.yaml \
  --values secrets.yaml \
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

1. **Verify configuration in Adaptor**:

   ```bash
   # Port-forward to Adaptor
   kubectl port-forward -n halo svc/adaptor 8443:443

   # In another terminal, check admin access
   curl -k -u admin:<new-password> https://localhost:8443/api/v1/config
   ```

### Step 6: Clean Up

Once bootstrapping is successful, remove the bootstrapper:

```bash
helm uninstall bootstrapper -n halo
```

## Configuration Reference

### Currency Codes

Common ISO 4217 currency codes for `terminalCurrencyCode`:

| Currency | Code | Numeric | |----------|------|---------| | US Dollar | USD | 0840 | | Euro | EUR
| 0978 | | British Pound | GBP | 0826 | | South African Rand | ZAR | 0710 | | Australian Dollar |
AUD | 0036 | | Canadian Dollar | CAD | 0124 |

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
- **Authentication failed**: Check admin credentials in secrets.yaml
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
     --values secrets.yaml \
     --namespace halo
   ```

### JWT Validation Errors

If SDK authentication fails after bootstrapping:

1. **Verify public key format**: Ensure PEM format with proper headers
1. **Check issuer name**: Must match exactly what's configured in your SDK
1. **Validate key pair**: Ensure public key matches the private key used for signing

## Security Considerations

1. **Secrets Management**:

   - Never commit `secrets.yaml` to version control
   - Use encryption tools for secrets at rest
   - Rotate admin password after initial setup

1. **Network Security**:

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
  --values secrets.yaml \
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

The following table lists the configurable parameters and their default values.

| Key | Default | Description |
|-----|---------|-------------|
| adaptor.currentPassword  | `"password"` | Set this to the current admin password, you do not necessarily need to update this  value, if the password is changed the bootstrapper will use the newPassword to login, sensitive |
| adaptor.namespace  | `"halo"` | Set this to the namespace of the halo adaptor |
| adaptor.newPassword  | `nil` | Set this to a new admin password if you want to change the admin password, required and sensitive |
| adaptor.url  | `"http://adaptor"` | Set this to the URL of the adaptor's service |
| adaptor.username  | `"admin"` | Set this to the current admin username |
| bootstrap.acquirer.alias  | `"Acquirer"` | Alias of the "Acquirer" (Acquirer is the Halo term for an App) |
| bootstrap.acquirer.name  | `"Acquirer"` | Name of the "Acquirer" (Acquirer is the Halo term for an App) |
| bootstrap.backoffLimit  | `1` | How many times the bootstrap job must try to run before failing |
| bootstrap.configOverride  | `[]` | Terminal config overrides, these must be set to override the default terminal config format for config overrides:  [   {     "aid": "A0000000031010",     "kernelID": 3,     "transactionTypeConfigs": [       {         "tlvDatabase": [           {             "tag": "EF8101",             "value": "999999999998"           }         ],         "transactionType": "00"       }     ]   } ]  |
| bootstrap.encryptTags  | `"57,5A"` | Tags which must be encrypted by the terminal |
| bootstrap.image.pullPolicy  | `"Always"` |  |
| bootstrap.image.repository  | `nil` | Image repository for the bootstrap image, required |
| bootstrap.image.tag  | `"latest"` | Tag for the bootstrap image, this overrides the version setting |
| bootstrap.jwt.issuerName  | `"jwtIssuer"` | Name for the iss field of the JWT you will issue to the SDK to authenticate your  users to the Adaptor |
| bootstrap.jwt.key  | `nil` | Public key used to validate the JWTs, required |
| bootstrap.name  | `"bootstrap"` | Name of the boostrap job |
| bootstrap.paymentProvider.name  | `"PaymentProvider"` | Name of the paymentprovider, can be left as default |
| bootstrap.paymentProvider.url  | `"http://paymentprovider"` | URL of the paymentprovider service |
| bootstrap.terminalCurrencyCode  | `"0710"` | Terminal currency code to set the terminal to |
| imageCredentials.email  | `"someone@host.com"` | Sets the email address for logging into the private registry |
| imageCredentials.enabled  | `false` | Enables using private registries with authentication |
| imageCredentials.password  | `"sillyness"` | Sets the password for logging into the private registry, sensitive |
| imageCredentials.registry  | `"quay.io"` | Sets the URL for the private registry to login to |
| imageCredentials.username  | `"someone"` | Sets the username for logging into the private registry |

