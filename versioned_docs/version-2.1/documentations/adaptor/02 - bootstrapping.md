# Bootstrapping

Once the Halo Dot Adaptor has been installed, the installation must be bootstrapped to get the initial database config created. Bootstrapping is also handled via a helm chart to simplify the process.

## Helm Chart Installation

All Halo Dot helm charts are available in a repo hosted on Github. To install the helm charts, please run the following commands:


1. Add helm repo
```
helm repo add halodot  https://halo-dot.github.io/helm-charts 
```

2. Install adaptor chart
```
helm install bootstrapper halodot/halo-adaptor-bootstrapper --values config.yaml --values secrets.yaml
```
In the command above, 2 values files are provided as input.
- config.yaml contains the mandatory config values that are not sensitive
- secrets.yaml contains the config values that are sensitive. We recommend storing an encrypted version of this file (using a tool such as <a href="https://github.com/getsops/sops">SOPS</a>) and then decrypting it at the time the command is executed.

## Bootstrapper Chart Values

| Key                               | Type   | Required/Optional | Description                                                                 | Default                                                                 |
|-----------------------------------|--------|-------------------|-----------------------------------------------------------------------------|-------------------------------------------------------------------------|
| `adaptor.namespace`               | string | Required          | Namespace that the adaptor has been deployed into                           | `halo`                                                                  |
| `adaptor.baseUrl`                 | string | Required          | Base URL for the adaptor service                                            | `http://adaptor                       `                                 |
| `bootstrapper.name`               | string | Required          | Name of the bootstrapper job                                                | `halo-adaptor-bootstrap`                                                |
| `bootstrapper.image.repository`   | string | Required          | Repository for the bootstrapper image                                       | `459295082152.dkr.ecr.eu-west-1.amazonaws.com/halo-adaptor-bootstrapper`|
| `bootstrapper.image.tag`          | string | Required          | Tag for the bootstrapper image                                              | `latest`                                                                |
| `bootstrapper.image.pullPolicy`   | string | Required          | Image pull policy                                                           | `Always`                                                                |
| `credentials.adminUsername`       | string | Required          | Admin username                                                              | `admin`                                                                 |
| `credentials.password`            | string | Required          | Current password for the admin user                                         | `password`                                                              |
| `credentials.newPassword`         | string | Optional          | New password for the admin user. The admin user's password will be updated to this value. The first time the chart is run, this needs to be set to change the default password |                                                                         |
| `acquirerDetails.name`            | string | Required          | Name of the acquirer                                                        | `acquirer`                                                              |
| `acquirerDetails.defaultTerminalCurrencyCode` | string | Required          | Default terminal currency code                                              | `0710`                                                                  |
| `jwtDetails.issuerClaim`          | string | Required          | JWT issuer claim                                                            |                                                                         |
| `jwtDetails.verificationKey`      | string | Required          | JWT verification key                                                        |                                                                         |
| `paymentProcessorDetails.name`    | string | Required          | Name of the payment processor                                               | `paymentprocessor`                                                      |
| `paymentProcessorDetails.url`     | string | Required          | URL for the payment processor service                                       | `http://adaptor                       `                                 |
| `paymentProcessorDetails.encryptTags` | list   | Optional          | Tags to be encrypted. Tag 57 (Track2 equivalent data) will always be encrypted, in addition to the specified tags |                                                                         |
| `terminalConfigOverrides`         | string | Optional          | Terminal configuration overrides                                            |                                                                         |

## Post Installation
Once the bootstrapper has been executed, the helm release can be uninstalled:
```
helm uninstall bootstrapper
```

It can be run multiple times if initial config has changed

## SDK Integration
[The SDK Integration guide](../sdk/02%20-%20sdk-integration-guide.md) can be followed to integrate the Halo Dot SDK into your application. The `aud` and `aud_fingerprint` claims 
would be pointing at the address of the adaptor that is deployed in your environment, while the `x-am-endpoint` and `x-am-endpoint-fingerprints` 
would be set to the Halo Dot A&M service.