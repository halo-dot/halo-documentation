# Halo Dot Adaptor Setup Guide

## Overview

Halo Dot is a Software Point of Sale (SoftPOS) provider that enables secure payment acceptance on
mobile devices. The Halo Dot Adaptor is a self-hosted service that allows you to process SoftPOS
payments within your own infrastructure while maintaining the security and compliance benefits of
the Halo Dot platform.

By deploying the Adaptor in your environment, you gain full control over payment data flow and
customer information and direct integration with your existing payment infrastructure.

The Adaptor maintains a secure connection to Halo Dot's attestation and monitoring (A&M) service to
ensure device security and compliance while processing payments locally.

## Architecture Overview

The Adaptor deployment creates a secure payment processing environment within your infrastructure:

![Adaptor architecture diagram](./adaptor-architecture.svg)

### Component Responsibilities

- **Adaptor Service**:

  - Processes payment requests from SoftPOS devices
  - Manages secure key generation and storage
  - Handles device attestation verification
  - Orchestrates transaction flow
  - Health checks include verification of A&M server connectivity

- **Payment Provider**:

  - Translates between Halo Dot protocol and your payment switch

- **HSM Service**:

  - Provides cryptographic operations for payment processing
  - Handles PIN and card data encryption
  - Interfaces with external Hardware Security Modules
  - Can be deployed as part of the Adaptor or implemented by your existing HSM infrastructure

- **Attestation & Monitoring (Halo Dot)**:

  - Verifies device integrity and security
  - Monitors for security threats

## Prerequisites

### Infrastructure Requirements

#### Kubernetes Cluster <a href="./adaptor#container-orchestration"><sup>†</sup></a>

- **Version**: 1.24 or higher
- **Nodes**: Minimum 3 nodes for production high availability
- **Resources**:
  - Minimum 4 vCPU and 8GB RAM available for Halo Dot services
  - Additional capacity for traffic spikes

#### PostgreSQL Database

- **Version**: 13 or higher
- **Configuration**:
  - SSL/TLS enabled (required for PCI compliance)
  - Connection pooling recommended
  - Backup strategy in place

#### Redis <a href="./adaptor#networked-cache"><sup>†</sup></a>

- **Version**: 6.2 or higher
- **Purpose**: Session management, caching, and temporary transaction data
- **Configuration**:
  - Authentication enabled
  - Persistence configured (AOF or RDB)
  - Memory limits set appropriately

#### Hardware Security Module (Optional) <a href="./adaptor#hsm-support"><sup>†</sup></a>

- **Supported**: Thales PayShield 10K
- **Network**: Accessible from Kubernetes cluster if using external HSM
- **Configuration**: Pre-configured with required LMKs
- **Alternative**: Deploy HSM Service component for HSM interface management

### AWS Requirements <a href="./adaptor#cloud-providers"><sup>†</sup></a>

The Adaptor automatically provisions its own KMS keys and secrets. You need:

- **IAM Role/User** with the following permissions:
  ```json
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "kms:CreateKey",
          "kms:CreateAlias",
          "kms:DescribeKey",
          "kms:GenerateDataKey",
          "kms:Decrypt",
          "kms:GenerateRandom"
        ],
        "Resource": "*"
      },
      {
        "Effect": "Allow",
        "Action": [
          "secretsmanager:CreateSecret",
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret",
          "secretsmanager:UpdateSecret"
        ],
        "Resource": "arn:aws:secretsmanager:*:*:secret:halo-*"
      }
    ]
  }
  ```

### Network Requirements

- **Outbound HTTPS (443)** to:
  - Halo Dot A&M service (will be provided)
  - AWS KMS and Secrets Manager endpoints
- **Inbound HTTPS (443)** from:
  - Your SoftPOS mobile applications
  - Your monitoring/operations tools
- **HSM Connectivity** 
  - Outbound TCP to HSM IP and port
  - Mutual TLS certificate configuration

### Access Requirements

- **Container Registry**: Credentials for Halo Dot private registry
- **Halo Dot Tenant ID**: Provided during onboarding
- **A&M Service Endpoint**: Provided during onboarding
- **Helm 3.x**: Installed on deployment machine

## Installation Steps

### Step 1: Configure Database and Redis

1. **Create PostgreSQL database**:

   ```sql
   CREATE DATABASE halodot_adaptor;
   CREATE USER halodot_user WITH ENCRYPTED PASSWORD '<secure-password>';
   GRANT ALL PRIVILEGES ON DATABASE halodot_adaptor TO halodot_user;
   ```

1. **Verify Redis authentication**:

   ```bash
   redis-cli -h <redis-host> -a <redis-password> ping
   # Should return: PONG
   ```

### Step 2: Add Helm Repository

```bash
helm repo add halodot https://halo-dot.github.io/helm-charts
helm repo update
```

### Step 3: Create Values Configuration

Create a `values.yaml` file tailored to your environment (a full list of parameters is available [here](#helm-values)):

```yaml
# Version provided by Halo Dot
version: "<provided-version>"

# Adaptor configuration
adaptor:
  image:
    repository: <Either your repository, or the repository provided by Halo Dot>
    pullPolicy: Always
  
  # High availability configuration
  replicaCount: 3
  namespace: halo
  
  # Logging configuration
  jsonLogs: true  # Required for log aggregation
  logLevel: "LogInfo"  # Use LogDebug only in non-production
  
  # The Adaptor will auto-generate this if not provided
  # jwtSigningSecret: "<auto-generated>"
  
  # Optional: External HSM service URL if not using the Halo HSM service
  # hsmServiceUrl: "https://external-hsm-service"
  
  # Service configuration
  service:
    listeningPort: 443 #Set to 80 when TLS is not enabled
  
  # TLS Configuration
  tls:
    enabled: true
    cert: |
      -----BEGIN CERTIFICATE-----
      <your-tls-certificate>
      -----END CERTIFICATE-----
    key: |
      -----BEGIN PRIVATE KEY-----
      <your-tls-key>
      -----END PRIVATE KEY-----
    ca: |
      -----BEGIN CERTIFICATE-----
      <your-ca-certificate>
      -----END CERTIFICATE-----
    passphrase: "<key-passphrase>"  # If key is encrypted
  
  # Health monitoring
  # The readiness probe verifies both service health and A&M server connectivity
  readinessProbe:
    enabled: true
    periodSeconds: 30

# Payment Provider configuration
paymentProvider:
  image:
    repository: <Either your repository, or the repository provided by Halo Dot>
    pullPolicy: Always
  
  replicaCount: 2
  
  # Config provided by Halo Dot, based on your payment provider
  # Format will be `HALO_<PAYMENT_PROVIDER_NAME>_<CONFIG_KEY>: <CONFIG_VALUE>`
  config:
    <Config provided by Halo Dot for your payment provider>
  
  service:
    listeningPort: 80
    targetPort: 7000 #Provided by Halo Dot, based on your payment provider

# Bin service configuration (only if required by your payment provider)
binService:
  enabled: false # Set to true if required by your payment provider
  image:
    repository: <Either your repository, or the repository provided by Halo Dot>
    pullPolicy: Always

# HSM Service configuration (required for PIN and card data encryption)
hsmService:
  enabled: true
  image:
    repository: <Either your repository, or the repository provided by Halo Dot>
    pullPolicy: Always
  
  replicaCount: 2
  
  # HSM connection settings
  hsm:
    enableMTls: true
    ip: "<your-hsm-ip>"
    port: <your-hsm-port>
    # Optional
    lmkId: "<your-lmk-id>" 
    name: "HSM"
    
    # HSM TLS certificates for mutual TLS
    ca: |
      -----BEGIN CERTIFICATE-----
      <hsm-ca-certificate>
      -----END CERTIFICATE-----
    cert: |
      -----BEGIN CERTIFICATE-----
      <hsm-client-certificate>
      -----END CERTIFICATE-----
    key: |
      -----BEGIN PRIVATE KEY-----
      <hsm-client-key>
      -----END PRIVATE KEY-----
  
  # HSM Service TLS configuration
  tls:
    enabled: true
    ca: |
      -----BEGIN CERTIFICATE-----
      <hsm-service-ca>
      -----END CERTIFICATE-----
    cert: |
      -----BEGIN CERTIFICATE-----
      <hsm-service-certificate>
      -----END CERTIFICATE-----
    key: |
      -----BEGIN PRIVATE KEY-----
      <hsm-service-key>
      -----END PRIVATE KEY-----
  
  # PCI compliance settings
  maskPciSensitiveData: true
  rkiKey: <your-AES-128-BDK>
  destinationPinKeyType: "BDK" # Or "ZMK"
  destinationPinKey: "<your-destination-pin-key>"
  destinationDataKeyType: "BDK" # Or "ZMK"
  destinationDataKey: "<your-destination-data-key>"

# Database configuration
database:
  host: "<your-postgres-host>"
  port: 5432
  databaseName: "halodot_adaptor"
  user: "halodot_user"
  password: "<secure-password>"

# Redis configuration
redis:
  host: "<your-redis-host>"
  port: 6379
  user: "redis"  # or your Redis ACL user
  password: "<redis-password>"

# AWS configuration
aws:
  region: "<your-aws-region>"
  accessKeyId: "<aws-access-key>"
  secretAccessKey: "<aws-secret-key>"
  
# Halo Dot A&M service endpoint
attestation:
  # Production endpoint provided during onboarding
  host: "<provided-am-endpoint>"

# Observability (Recommended)
openTelemetry:
  metricsEndpoint: "http://otel-collector.monitoring:4317/v1/metrics"
  tracesEndpoint: "http://otel-collector.monitoring:4317/v1/traces"

# Private registry authentication
imageCredentials:
  enabled: true
  registry: "<provided-registry>"
  username: "<provided-username>"
  password: "<provided-password>"
  email: "ops@yourcompany.com"
```

### Step 4: Deploy the Adaptor

1. **Dry run to validate configuration**:

   ```bash
   helm install halodot-adaptor halodot/adaptor \
     -f values.yaml \
     --namespace halo \
     --dry-run --debug
   ```

1. **Deploy to your cluster**:

   ```bash
   helm install halodot-adaptor halodot/adaptor \
     -f values.yaml \
     --namespace halo \
     --wait \
     --timeout 10m
   ```

1. **Monitor deployment progress**:

   ```bash
   # Watch pod creation
   kubectl get pods -n halo -w

   # Check events for any issues
   kubectl get events -n halo --sort-by='.lastTimestamp'
   ```

### Step 5: Verify Deployment

1. **Check pod status**:

   ```bash
   kubectl get pods -n halo
   ```

   All pods should be in `Running` state with readiness probes passing.

1. **Verify automatic secret creation**:

   ```bash
   # Check AWS Secrets Manager
   aws secretsmanager list-secrets --filters Key=name,Values=halo
   ```

   You should see the three auto-created secrets.

1. **Check KMS key creation**:

   ```bash
   aws kms list-aliases | grep haloCmk
   ```

1. **Verify A&M server connectivity**: The Adaptor's readiness probe automatically verifies
   connectivity to the Halo Dot A&M server. If pods are in `Ready` state, the A&M connection is
   working correctly.

1. **Test health endpoint**:

   ```bash
   kubectl port-forward -n halo svc/adaptor 8443:443
   # In another terminal:
   curl -k https://localhost:8443/healthz
   ```

1. **Verify HSM Service (if enabled)**:

   ```bash
   kubectl get pods -n halo -l app=hsmservice
   kubectl logs -n halo -l app=hsmservice --tail=50
   ```

## Post-Installation Configuration

### Run the Bootstrapping Job

Running the boostrapping job is described on the [bootstrapping guide](./bootstrapping). 
This will setup the database with the initial config values required for running the adaptor.

### Provide Halo Dot with your JWT issuer name and public key

The Halo Dot A&M server uses the JWTs you issue to authenticate requests from your adaptor deployment. 
To get access to the Adaptor you will have had to provide us with your JWT key. If you have not done 
so yet, or have changed your JWT key, you will have to provide the new key to Halo Dot by either adding 
it to the developer portal or contacting Halo Dot support.

### Configure Ingress for External Access

Create an ingress resource for SoftPOS devices to reach the Adaptor:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: adaptor-ingress
  namespace: halo
  annotations:
    # Adjust based on your ingress controller
    nginx.ingress.kubernetes.io/ssl-protocols: "TLSv1.2,TLSv1.3"
    nginx.ingress.kubernetes.io/ssl-ciphers: "ECDHE-ECDSA-AES256-GCM-SHA384,ECDHE-RSA-AES256-GCM-SHA384"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - softpos-api.yourdomain.com
    secretName: adaptor-tls
  rules:
  - host: softpos-api.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: adaptor
            port:
              number: 443
```

## SoftPOS Integration

To integrate the HaloDot SDK into your SoftPOS mobile applications, follow the
[SDK Integration Guide](../sdk/sdk-integration-guide). When configuring the SDK for use
with your Adaptor deployment, you'll need to set the following claims:

### SDK JWT Configuration

Configure the JWT claims in your mobile application:

- **`aud` and `aud_fingerprint`**: Point to your Adaptor's endpoint (e.g.,
  `softpos-api.yourdomain.com`)
- **`x-am-endpoint` and `x-am-endpoint-fingerprints`**: Set to the HaloDot A&M service endpoint
  provided during onboarding

## Troubleshooting

### Initial Deployment Issues

#### Adaptor Fails to Start

**Check logs**:

```bash
kubectl logs -n halo -l app=adaptor --tail=100
```

**Common issues**:

- **"Failed to create KMS key"**: Check AWS IAM permissions
- **"Database connection failed"**: Verify PostgreSQL connectivity and credentials
- **"Redis connection refused"**: Check Redis host and authentication
- **"Cannot reach A&M service"**: Verify network egress and endpoint URL

#### HSM Service Issues

**Check HSM Service logs**:

```bash
kubectl logs -n halo -l app=hsmservice --tail=100
```

**Common issues**:

- **"HSM connection failed"**: Verify HSM IP, port, and network connectivity
- **"Certificate validation failed"**: Check mutual TLS certificate configuration
- **"Invalid LMK ID"**: Verify LMK ID configuration on HSM
- **"Incorrect Key"**: Ensure the HSM rkiKey and destination keys are correctly configured

#### Secret Creation Failures

**Verify AWS credentials**:

```bash
kubectl exec -n halo deploy/adaptor -- aws sts get-caller-identity
```

**Check KMS key creation**:

```bash
kubectl exec -n halo deploy/adaptor -- aws kms describe-key --key-id alias/haloCmk
```

#### Readiness Probe Failures

**Symptom**: Pods remain in `Not Ready` state

**Check**:

```bash
kubectl logs -n halo -l app=adaptor | grep -i health
```

**Common causes**:

- Cannot reach A&M server (most common)
- Incorrect A&M endpoint URL
- Network policy blocking egress to A&M service
- HSM Service not responding (if enabled)

**Verify A&M connectivity specifically**:

```bash
# Check if the configured A&M endpoint is reachable
kubectl exec -n halo deploy/adaptor -- nslookup <am-endpoint-domain>
kubectl exec -n halo deploy/adaptor -- curl -v <am-endpoint>/healthz
```

## Maintenance

### Upgrade Process

1. **Check for updates**:

   ```bash
   helm repo update
   helm search repo halodot/adaptor --versions
   ```

1. **Review changelog** and update `values.yaml` if needed

1. **Perform rolling upgrade**:

   ```bash
   helm upgrade halodot-adaptor halodot/adaptor \
     -f values.yaml \
     --namespace halo \
     --wait
   ```

## Support

For support:

1. Collect diagnostic information:

   ```bash
   kubectl get all -n halo
   kubectl describe pods -n halo
   kubectl logs -n halo --tail=1000 > halo-logs.txt
   ```

1. Include:

   - Helm values (sanitized)
   - Error messages
   - Transaction IDs for specific issues

1. Contact Halo Dot support with your issuer name and diagnostic bundle

## Helm values 

The following table lists the configurable parameters and their default values.

| Parameter | Description | Default |
|-----------|-------------|---------|
| `version` | Container image tag for adaptor and payment provider, required | `latest` |
| `aws.accessKeyId` | Access key ID for your AWS IAM user, required | `null` |
| `aws.secretAccessKey` | Secret access key for your AWS IAM user, required and sensitive | `null` |
| `aws.region` | AWS region, required | `us-west-2` |
| `database.host` | PostgreSQL database hostname, required | `null` |
| `database.port` | PostgreSQL database port | `5432` |
| `database.user` | PostgreSQL database user, required | `null` |
| `database.password` | PostgreSQL database password, required and sensitive | `null` |
| `database.databaseName` | PostgreSQL database name, required | `null` |
| `redis` | Connection information for Redis | `{host: null, password: null, port: 6379, tls: {ca: null, cert: null, enabled: false,...` |
| `redis.host` | Redis hostname, if Redis is deployed in cluster using  the Redis helm chart this should be set to redis-master.default.svc.cluster.local, required | `null` |
| `redis.port` | Redis port | `6379` |
| `redis.user` | Redis user | `redis` |
| `redis.password` | Redis password, required and sensitive | `null` |
| `redis.tls.enabled` | Whether to enable TLS for Redis, required if your Redis instance requires TLS | `false` |
| `redis.tls.ca` | CA certificate for Redis TLS, required if your Redis instance requires TLS | `null` |
| `redis.tls.cert` | Client certificate for Redis TLS, required if your Redis instance requires client certs | `null` |
| `redis.tls.key` | Client key for Redis TLS, required if your Redis instance requires client certs, sensitive | `null` |
| `redis.tls.passphrase` | Optional passphrase for encrypting the Redis client key, sensitive | `null` |
| `attestation.host` | Remote attestation hostname, for non prod you can use  the QA endpoint set here, for production you will  be provided with a URL specifically for you, required | `https://kernelserver.qa.haloplus.io` |
| `keys.dbIntegrity` | Secrets manager secret name for DB integrity secret | `haloDbIntegrity` |
| `keys.dbEncryptionKey` | Secrets manager secret name for DB encryption secret | `haloDbEncryption` |
| `keys.transactionSigning` | Secrets manager secret name for transaction signing secret | `haloTransactionSigning` |
| `keys.cmk` | KMS CMK used to encrypt the Secrets manager secrets | `haloCmk` |
| `adaptor.namespace` | K8s namespace to deploy the adaptor into | `halo` |
| `adaptor.name` | Name of the adaptor deployment and service | `adaptor` |
| `adaptor.replicaCount` | Replica count of the adaptor, you should probably set this to your at least your node count | `1` |
| `adaptor.readinessProbe` | Readiness probe settings for adaptor, the adaptor readiness probe checks that the service is up,  as well as checking that the A&M server is up and reachable | `{enabled: true, periodSeconds: 30}` |
| `adaptor.readinessProbe.enabled` | Enable the readiness probe, you might want to disable this if you are testing without  access to the A&M server | `true` |
| `adaptor.readinessProbe.periodSeconds` | How often to run the readiness probe | `30` |
| `adaptor.image.repository` | Image repository for the adaptor image, required | `null` |
| `adaptor.image.tag` | Tag for the adaptor image, this overrides the version setting | `null` |
| `adaptor.service.targetPort` | Port the adaptor listens on | `9000` |
| `adaptor.service.listeningPort` | Port that the adaptor service exposes, if HTTPS is enabled, this should be set to 443 | `80` |
| `adaptor.logLevel` | Logging level for the adaptor. Choices are LogDebug, LogInfo, LogWarn and LogError  LogDebug provides full logging, including requests, responses and all card details  LogInfo provides some logging, useful for investigating the state of the system without leaking card data  Should be set to LogInfo in production and LogDebug in nonprod | `LogInfo` |
| `adaptor.jsonLogs` | JSON formatted logs, should be set to true when using logging tooling such as Grafana Loki or ELK.  Can be useful to turn off when testing locally | `true` |
| `adaptor.resources` | Resource limits and requests, these values can be tuned based on your volumes, it is recommended to set  memory limits and requests to the same value | `{limits: {cpu: 500m, memory: 1G}, requests: {cpu: 100m, memory: 1G}}` |
| `adaptor.tls.enabled` | Whether to enable TLS on the adaptor | `false` |
| `adaptor.tls.cert` | The TLS server certificate | `-----BEGIN CERTIFICATE-----...` |
| `adaptor.tls.key` | The TLS server key, sensitive | `-----BEGIN PRIVATE KEY-----...` |
| `adaptor.tls.ca` | The TLS server CA | `-----BEGIN CERTIFICATE-----...` |
| `adaptor.tls.passphrase` | Optional passphrase for encrypting the TLS key, sensitive | `null` |
| `adaptor.jwtSigningSecret` | HS256 Secret used for issuing tokens for admin users, if not set a random value will be generated | `null` |
| `adaptor.hsmServiceUrl` | If HSM service is not enabled, this is the hostname name of the implementation of the HSM service to use, format is `http(s)://<hostname>:<port>` | `null` |
| `scheduledJobs.voids` | Job for voiding failed transaction | `{cron: '*/30 * * * *', enabled: true, maxRetries: 10, runAtStartup: false}` |
| `scheduledJobs.voids.enabled` | Sets whether voiding failed transactions should run | `true` |
| `scheduledJobs.voids.cron` | How often the void job should run | `*/30 * * * *` |
| `scheduledJobs.voids.maxRetries` | How often many times a failed transaction should try be voided before giving up | `10` |
| `scheduledJobs.voids.runAtStartup` | Whether the void job should run when the adaptor starts up | `false` |
| `paymentProvider.name` | Name of the paymentprovider deployment and service | `paymentprovider` |
| `paymentProvider.replicaCount` | Replica count of the payment provider, should probably be set to at least node count | `1` |
| `paymentProvider.readinessProbe.enabled` | Enables the readiness probe for the payment provider | `true` |
| `paymentProvider.readinessProbe.periodSeconds` | The frequency of readiness probes | `30` |
| `paymentProvider.service.targetPort` | The port the paymentprovider listens on, this will be provided along with the config for the paymentprovider | `null` |
| `paymentProvider.service.listeningPort` | kThe port the paymentprovider service exposes | `80` |
| `paymentProvider.image.repository` | Image repository for the paymentprovider image | `null` |
| `paymentProvider.image.tag` | Tag for the paymentprovider image, this overrides the version setting | `null` |
| `paymentProvider.resources` | Resource limits and requests, these values can be tuned based on your volumes, it is recommended to set  memory limits and requests to the same value | `{limits: {cpu: 500m, memory: 256Mi}, requests: {cpu: 100m, memory: 256Mi}}` |
| `paymentProvider.config` | Config for the paymentprovider, this is specific per payment provider and will be provided, required  Format will be `HALO_<PAYMENT_PROVIDER_NAME>_<CONFIG_KEY>: <CONFIG_VALUE>` | `{env: null, file: [{content: null, name: CONFIG_FILE, path: /etc/paymentprovider/config.json}]}` |
| `binService.enabled` | Whether to enable the BIN service, this may be required by your payment provider | `false` |
| `binService.name` | Name of the BIN service deployment and service | `binservice` |
| `binService.image.repository` | Image repository for the BIN service image, required | `null` |
| `binService.image.tag` | Tag for the BIN service image, this overrides the version setting | `null` |
| `binService.service.targetPort` | The port the BIN service listens on, this will be provided along with the config for the BIN service | `7011` |
| `binService.service.listeningPort` | The port the BIN service exposes, if TLS is enabled this should be set to 443 | `80` |
| `binService.readinessProbe.enabled` | Enables the readiness probe for the BIN service | `true` |
| `binService.readinessProbe.periodSeconds` | The frequency of readiness probes | `30` |
| `binService.resources` | Resource limits and requests, these values can be tuned based on your volumes, it is recommended to set  memory limits and requests to the same value | `{limits: {cpu: 500m, memory: 256Mi}, requests: {cpu: 100m, memory: 256Mi}}` |
| `hsmService.enabled` | Whether to enable the HSM service, this is required for PIN and card data encryption | `true` |
| `hsmService.name` | Name of the HSM service deployment and service | `hsmservice` |
| `hsmService.image.repository` | Image repository for the HSM service image, required | `null` |
| `hsmService.image.tag` | Tag for the HSM service image, this overrides the version setting | `null` |
| `hsmService.service.targetPort` | The port the HSM service listens on, this will be provided along with the config for the HSM service | `3000` |
| `hsmService.service.listeningPort` | The port the HSM service exposes, if TLS is enabled this should be set to 443 | `80` |
| `hsmService.readinessProbe.enabled` | Enables the readiness probe for the HSM service | `true` |
| `hsmService.readinessProbe.periodSeconds` | The frequency of readiness probes | `30` |
| `hsmService.resources` | Resource limits and requests, these values can be tuned based on your volumes, it is recommended to set  memory limits and requests to the same value | `{limits: {cpu: 500m, memory: 256Mi}, requests: {cpu: 100m, memory: 256Mi}}` |
| `hsmService.hsm.enableMTls` | Whether to enable mutual TLS with the HSM, this is required for secure communication with the HSM | `true` |
| `hsmService.hsm.ip` | The IP address of the HSM, required | `null` |
| `hsmService.hsm.port` | The port the HSM listens on, required | `null` |
| `hsmService.hsm.lmkId` | The LMK ID for the HSM | `null` |
| `hsmService.hsm.name` | The name of the HSM | `HSM` |
| `hsmService.hsm.ca` | The CA certificate for TLS with HSM | `-----BEGIN CERTIFICATE-----...` |
| `hsmService.hsm.cert` | The client certificate for the HSM | `-----BEGIN CERTIFICATE-----...` |
| `hsmService.hsm.key` | The client key for the HSM | `-----BEGIN PRIVATE KEY-----...` |
| `hsmService.tls.enabled` | Whether to enable TLS on the HSM service, this is required for secure communication with the HSM service if a service mesh is not used | `true` |
| `hsmService.tls.ca` | CA certificate for TLS for the HSM service | `-----BEGIN CERTIFICATE-----...` |
| `hsmService.tls.cert` | Server certificate for TLS for the HSM service | `-----BEGIN CERTIFICATE-----...` |
| `hsmService.tls.key` | Server key for TLS for the HSM service, sensitive | `-----BEGIN PRIVATE KEY-----...` |
| `hsmService.maskPciSensitiveData` | Setting to disable masking PCI sensitive data in logs, this should be set to true in production. Useful for debugging in nonprod | `true` |
| `hsmService.destinationPinKeyType` | Setting to choose the key type for destination PIN keys, options are BDK or ZMK | `BDK` |
| `hsmService.destinationPinKey` | Value of the destination PIN key generated on the HSM. | `null` |
| `hsmService.destinationDataKeyType` | Setting to choose the key type for destination data keys, options are BDK or ZMK | `BDK` |
| `hsmService.destinationDataKey` | Value of the destination card data encryption key generated on the HSM, sensitive | `null` |
| `hsmService.rkiKey` | Value of the HSM BDK key used to derive PIN keys injected into the SDK, sensitive  This key must be an AES 128 BDK. | `null` |
| `hsmService.apiKey` | The API key for the HSM service, this is used to authenticate requests to the HSM service.  If this is not set, a random value will be generated, sensitive | `null` |
| `imageCredentials.enabled` | Enables using private registries with authentication | `false` |
| `imageCredentials.registry` | Sets the URL for the private registry to login to | `quay.io` |
| `imageCredentials.username` | Sets the username for logging into the private registry | `someone` |
| `imageCredentials.password` | Sets the password for logging into the private registry, sensitive | `sillyness` |
| `imageCredentials.email` | Sets the email address for logging into the private registry | `someone@host.com` |
| `openTelemetry.metricsEndpoint` | Opentelemetry metrics endpoint | `http://otel-collector:4317/v1/metrics` |
| `openTelemetry.tracesEndpoint` | Opentelemetry traces endpoint | `http://otel-collector:4317/v1/traces` |

## Support for alternative prerequisites

### Container Orchestration

The Halo Dot Adaptor is packaged as container images that can run on any orchestration platform, including Kubernetes, HashiCorp Nomad, Docker Swarm, and others.

**Current Support**: This guide and the provided Helm charts are designed specifically for Kubernetes deployments. 

**Other Platforms**: While the containers are platform-agnostic, deploying on non-Kubernetes platforms requires manual configuration of the deployment manifests and networking. Native support for additional platforms (such as Hashicorp Nomad) is planned for future releases.

Contact Halo Dot support if you require assistance with non-Kubernetes deployments

### Networked Cache

Currently only Redis is supported for networked cache.

Contact Halo Dot support if there are alternative network caching services you would like us to support.

### Cloud Providers

The Halo Dot Adaptor uses cloud services for secure key management and secret storage:

**AWS (Currently Supported)**
- Hardware-backed key generation and entropy via AWS KMS
- Secure secret storage via AWS Secrets Manager

**Azure (Planned)**
- Support for Azure Key Vault is on our roadmap

**Other Environments**
- If AWS or Azure don't meet your requirements, contact Halo Dot support to discuss alternatives for your specific environment

### HSM Support

The Halo Dot Adaptor currently supports Thales PayShield 10K HSMs for secure PIN and card data encryption.
Support for the Utimaco AT1000 HSM is planned for future releases.
