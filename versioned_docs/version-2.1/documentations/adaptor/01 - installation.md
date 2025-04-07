# Installation

The Halo Dot Adaptor is offered as a Helm chart that can be installed into a client's existing Kubernetes orchestrator. The high-level process is as follows:

1. Install `adaptor` chart to set up necessary components
2. Install `adaptor-bootstrap` chart to perform necessary bootstrapping actions. This chart runs a single Kubernetes Job to bootstrap the adaptor. Once the process has completed, the bootstrap Helm deployment can be uninstalled


## Helm Chart Installation

All Halo Dot helm charts are available in a repo hosted on Github. To install the helm charts, please run the following commands:


1. Add helm repo
```
helm repo add halodot  https://halo-dot.github.io/helm-charts 
```

2. Install adaptor chart
```
helm install adaptor halodot/halo-adaptor --values config.yaml --values secrets.yaml
```
In the command above, 2 values files are provided as input.
- config.yaml contains the mandatory config values that are not sensitive
- secrets.yaml contains the config values that are sensitive. We recommend storing an encrypted version of this file (using a tool such as <a href="https://github.com/getsops/sops">SOPS</a>) and then decrypting it at the time the command is executed.

## Adaptor Chart Values

| Key                         | Type    | Required/Optional | Description                                                                 | Default |
|-----------------------------|---------|-------------------|-----------------------------------------------------------------------------|---------|
| `aws.accessKeyId`           | string  | Optional          | AWS Access Key ID                                                           |         |
| `aws.secretAccessKey`       | string  | Optional          | AWS Secret Access Key (sensitive)                                           |         |
| `aws.sessionToken`          | string  | Optional          | AWS Session Token (sensitive)                                     |         |
| `aws.region`                | string  | Optional          | AWS Region                                                                  |         |
| `database.host`             | string  | Required          | Hostname of database server                                                 |         |
| `database.port`             | int     | Optional          | Port of database server                                                     | 5432    |
| `database.user`             | string  | Required          | Username to connect to database                                             |         |
| `database.password`         | string  | Required          | Password to connect to database (sensitive)                                 |         |
| `database.databaseName`     | string  | Optional          | Name of the database within the database server                             | halo    |
| `redis.host`                | string  | Required          | Hostname of Redis server                                                    |         |
| `redis.port`                | int     | Optional          | Port of Redis server                                                        | 6379    |
| `redis.user`                | string  | Optional          | Username to connect to Redis                                                |         |
| `redis.password`            | string  | Required          | Password to connect to Redis (sensitive)                                    |         |
| `attestation.host`          | string  | Required          | Host URL of the attestation service                                         | https://kernelserver.go.dev.haloplus.io |
| `attestation.apiKey`        | string  | Required          | API key for the attestation service (sensitive)                             |         |
| `keys.messageSigning`       | string  | Required          | AWS Key used to sign messages                                               |         |
| `keys.dbIntegrity`          | string  | Required          | AWS Key used to sign database records                                       |         |
| `keys.dbEncryptionKey`      | string  | Required          | AWS Key used to encrypt sensitive database records                          |         |
| `keys.logIntegrityKey`      | string  | Required          | AWS Key used to sign audit log messages                                     |         |
| `adaptor.namespace`         | string  | Optional          | Kubernetes namespace for the adaptor                                        | halo    |
| `adaptor.name`              | string  | Optional          | Name of the adaptor service                                                 | adaptor |
| `adaptor.replicaCount`      | int     | Optional          | Number of replicas for the adaptor service                                  | 1       |
| `adaptor.image.repository`  | string  | Optional          | Docker repository for the adaptor image                                     | 459295082152.dkr.ecr.eu-west-1.amazonaws.com/halo-adaptor-server |
| `adaptor.image.tag`         | string  | Optional          | Tag for the adaptor image                                                   | latest  |
| `adaptor.image.pullPolicy`  | string  | Optional          | Image pull policy                                                           | Always  |
| `adaptor.service.targetPort`| int     | Optional          | Target port for the adaptor service                                         | 9000    |
| `adaptor.service.listeningPort`| int  | Optional          | Listening port for the adaptor service                                      | 80      |
| `adaptor.probes.startup.initialDelaySeconds`  | int | Optional | Initial delay before startup probe is initiated                             | 60      |
| `adaptor.probes.startup.periodSeconds`        | int | Optional | Period between startup probe checks                                         | 10      |
| `adaptor.probes.startup.timeoutSeconds`       | int | Optional | Timeout for each startup probe check                                        | 5       |
| `adaptor.probes.startup.successThreshold`     | int | Optional | Number of successful checks before considering the startup probe successful | 1       |
| `adaptor.probes.startup.failureThreshold`     | int | Optional | Number of failed checks before considering the startup probe failed         | 100     |
| `adaptor.logLevel`          | string  | Optional          | Log level for the adaptor service                                           | LogInfo |
| `adaptor.resources.limits.cpu` | string | Optional          | CPU limit for the adaptor service                                           | 100m    |
| `adaptor.resources.limits.memory` | string | Optional        | Memory limit for the adaptor service                                        | 256Mi   |
| `adaptor.resources.requests.cpu` | string | Optional        | CPU request for the adaptor service                                         | 100m    |
| `adaptor.resources.requests.memory` | string | Optional       | Memory request for the adaptor service                                      | 256Mi   |
| `adaptor.tls.enabled`       | bool    | Optional          | Enable TLS for the adaptor service                                          | false   |
| `adaptor.tls.cert`          | string  | Optional          | TLS certificate                                                             |         |
| `adaptor.tls.key`           | string  | Optional          | TLS private key (sensitive)                                                 |         |
| `adaptor.tls.ca`            | string  | Optional          | TLS CA certificate                                                          |         |
| `adaptor.tls.passphrase`    | string  | Optional          | Passphrase for the TLS private key (sensitive)                              |         |
