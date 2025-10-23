---
description: >-
  The purpose of the SDK is to process payment, whilst you embed it in your
  current working application.
---

# Accessing the SDK

The SDK is hosted in a maven repo, through an S3 bucket in a Halo AWS account.

A debug version of the SDK is made available to support development efforts, but only the release version will be permitted to transact in production. The debug version has full logging enabled and allows a debugger to be attached to the integrating app.

## Accessing Maven Repo

1. In order to access the SDK, we generate an AWS access key and secret key when you register on the developer portal [here](https://go.developerportal.qa.haloplus.io/).\
   These are **sensitive** and should not be committed to source control. \
   Add the credentials to the `local.properties` file located in your android app source.

```
aws.accesskey= < PROVIDED IN EMAIL >
aws.secretkey= < PROVIDED IN EMAIL >
```

2. Add the following to your project-level gradle file, to read the access credentials into variables:


```kotlin
ext {
    Properties properties = new Properties()
    def propertiesFile = project.rootProject.file('local.properties')
    if (propertiesFile.exists()) {
        properties.load(propertiesFile.newDataInputStream())
    }

    def localAccessKey = properties.getProperty('aws.accesskey')
    def systemEnvAccessKey = System.getenv('AWS_ACCESS_KEY_ID')

    def localSecretKey = properties.getProperty('aws.secretkey')
    def systemEnvSecretKey = System.getenv('AWS_SECRET_ACCESS_KEY')

    accessKey = localAccessKey != null ? localAccessKey : systemEnvAccessKey
    secretKey = localSecretKey != null ? localSecretKey : systemEnvSecretKey
}
```

3. Add the following to your module-level gradle file to pull the artifacts:

You need to add two repos:

* Snapshots: Debug builds
* Release: Release builds

```
repositories {
    def repos = [
            'releases',
            'snapshots'
    ]

    repos.each { repo ->
        maven {
            name = repo
            url = "s3://synthesis-halo-artifacts/$repo"
            credentials(AwsCredentials) {
                accessKey = rootProject.ext.accessKey
                secretKey = rootProject.ext.secretKey
            }
        }
    }
}

dependencies {
    releaseImplementation group: "za.co.synthesis.halo", name: "sdk", version: "4.0.8"
    debugImplementation group: "za.co.synthesis.halo", name: "sdk", version: "4.0.8-debug"
}
```

After a gradle sync, you should now be able to import from the za.co.synthesis.halo.sdk namespace, e.g:

```
import za.co.synthesis.halo.sdk.HaloSDK
```

For a more technical integration guide, see the [next guide](/docs/documentations/sdk/sdk-integration-guide).
