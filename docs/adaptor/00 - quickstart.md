# Quick start

Prerequisites :
    - Kubernetes  <a href="./adaptor#container-orchestration"><sup>†</sup></a>
    - Redis <a href="./adaptor#networked-cache"><sup>†</sup></a>
    - PostgreSQL
    - AWS <a href="./adaptor#cloud-providers"><sup>†</sup></a>

Add the Halo Dot Helm charts

```sh
helm repo add halodot  https://halo-dot.github.io/helm-charts
helm repo update
```

Create a config file to set the required config for your deployment. For more details on how to setup
the Adaptor refer to the [Adaptor setup guide](./adaptor)

```yaml
version: latest

aws:
  accessKeyId: <AWS IAM user access key ID>
  secretAccessKey: <AWS IAM user secret access key>
  region: <AWS region>
  
database:
  host: <Postgres host>
  user: <Postgres user>
  password: <Postgres user password>
  databaseName: <Postgres database name>
  
redis:
  host: <Redis hostname>
  user: <Redis user>
  password: <Redis password>
  
attestation:
  host: https://kernelserver.qa.haloplus.io

adaptor:
  image:
    repository: <image registry storing the adaptor Docker image>

paymentProvider:
  image:
    repository: <image registry storing the paymentprovider Docker image>
  service:
    targetPort: <port the payement provider runs on>
  config: <config for the payment provider, provided by Halo Dot>
```

Install the Halo Dot Adaptor using

```sh
helm install adaptor halodot/halo-adaptor --values config.yaml
```

Check the pod status, make sure its up and ready (this confirms A&M connectivity)
```sh
kubectl get pods -n halo
```

When the service is ready, run the bootstrapping chart to configure the Adaptor. 

First create a values file for the bootstrapper. For more details on how to setup
the Adaptor refer to the [Bootstrapping guide](./bootstrapping) 

```yaml
adaptor:
  newPassword: password

bootstrap:
  image:
    repository: <image registry storing the bootstrapper Docker image>
    
  jwt:
    issuerName: <iss field of the JWTs you issue to the SDK>
    key: |
      -----BEGIN PUBLIC KEY-----
      <public key used to validate the JWTs>
      -----END PUBLIC KEY-----
```

Then install the bootstrapper Helm chart

```sh
helm install bootstrapper halodot/halo-adaptor-bootstrapper --values bootstrap-config.yaml
```

## SDK Integration
[The SDK Integration guide](../sdk/sdk-integration-guide) can be followed to integrate the Halo Dot SDK into your application. The `aud` and `aud_fingerprint` claims 
would be pointing at the address of the adaptor that is deployed in your environment, while the `x-am-endpoint` and `x-am-endpoint-fingerprints` 
would be set to the Halo Dot A&M service.
