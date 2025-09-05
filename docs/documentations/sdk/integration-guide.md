---
id: integration-guide
sidebar_class_name: hidden
tags:
  - sdk
  - guides
---

# Halo.SDK Integration Guide

Welcome to the Halo.SDK integration guide! Follow these steps to quickly integrate the Halo.SDK into your Android application.

## Getting Started

To start integrating the Halo.SDK into your app, you will need to add it as a dependency in your project.<br/>
Both debug and release versions of the SDK are available. <br/>
The release version is suitable for production use. <br/>
The debug version is intended for development and testing purposes; it has full logging enabled and allows a debugger to be attached to the app.

## Requirements

Before you begin, ensure you have the following:

* **<a href="https://developer.android.com/studio" target="_blank">Android Studio</a>:** You will need Android Studio installed on your system to run the test app.
* At least **<a href="https://www.oracle.com/java/technologies/downloads/#java17" target="_blank">Java JDK 17</a>** installed on your system.
  * If you use a newer version you may be required to upgrade the gradle version in the test app repository.
  * Current <a href="https://github.com/halo-dot/test_app-android_sdk/blob/master/test_app/gradle/wrapper/gradle-wrapper.properties" target="_blank">gradle version is 7.5.1</a>.
* **<a href="https://git-scm.com/" target="_blank">Git</a>** installed on your system.
* Access the Android **<a href="https://github.com/halo-dot/test_app-android_sdk" target="_blank">test app repository on GitHub</a>**.
* Generate your own **<a href="http://docs.halodot.io/docs/documentations/sdk/jwt" target="_blank">public key and private key pair</a>**, this will be used to create a jwt token.

## Setup

### Clone the test app repository

```bash
git clone https://github.com/halo-dot/test_app-android_sdk.git
cd test_app-android_sdk/test_app
cd studio .
```

Android Studio will automatically run Gradle Sync.<br/>
If you encounter any issues, please refer to the [FAQ](#frequently-asked-questions) section.

### Configure The Test App

Open [app/src/main/java/za/co/synthesis/halo/halotestapp/Config.kt](https://github.com/halo-dot/test_app-android_sdk/blob/master/test_app/app/src/main/java/za/co/synthesis/halo/halotestapp/Config.kt) and replace the placeholder values of `PRIVATE_KEY_PEM`, `ISSUER`, and `USERNAME` with your own values.<br/>
You will need the private key you used to generate your public key, your issuer name, and your username.

```kotlin
package za.co.synthesis.halo.halotestapp

object Config {
   const val PRIVATE_KEY_PEM = "{{PRIVATE_KEY_PEM}}"
   const val HOST = "{{HOST}}"
   const val AUD = "{{AUD}}"
   const val KSK = "{{KSK}}"
   const val ISSUER = "{{ISSUER}}"
   const val USERNAME = "{{USERNAME}}"
   const val MERCHANT_ID = "{{MERCHANT_ID}}"

}
```
### Configure local.properties

The Halo.SDK is hosted in a Maven repository, and stored in an S3 bucket in a Halo AWS account.<br/>
We have generated a `AWS_ACCESS_KEY` and `AWS_SECRET_KEY` for you to access the repo.
Open [local.properties](https://github.com/halo-dot/test_app-android_sdk/blob/master/test_app/local.properties) and and add the values of `AWS_ACCESS_KEY` and `AWS_SECRET_KEY` with your own values.

```bash
aws_access_key={{AWS_ACCESS_KEY}}
aws_secret_key={{AWS_SECRET_KEY}}
```
<hr/>
## Build and Run

### Build

You should be able to build and run the test app using Android Studio.

![alt text](http://docs.halodot.io/assets/images/test-app-f5854065b979828a83a96aae3c4ddfb2.png)

### Test Cards

* Use the <a href="https://play.google.com/store/apps/details?id=com.visa.app.cdet&hl=en_ZA" target="_blank">Visa CDET card</a> for testing.<br/>
  * Use test card number 1 in the Visa CDET application.
* Use a test card provided by the bank
* **DO NOT** use actual card numbers for testing.

<hr/>
### Issues

* See [Setup Issues](/docs/documentations/faq/integration-issues#setup-issues)
* See [Running Issues](/docs/documentations/faq/integration-issues#running-issues)

## More about the SDK

* Details on how to access the <a href="http://docs.halodot.io/docs/documentations/sdk/getting-started-with-sdk" target="_blank">SDK</a>
* How to programmatically initialize the SDK <a href="http://docs.halodot.io/docs/documentations/sdk/sdk-integration-guide#6-initiallization-of-the-sdk" target="_blank">here</a>
* <a href="http://docs.halodot.io/docs/documentations/sdk/sdk-integration-guide/#7-transaction-flow" target="_blank">How to start a transaction</a>
* <a href="http://docs.halodot.io/docs/documentations/sdk/sdk-integration-guide#5-life-cycle-methods" target="_blank">The life cycle of the SDK </a>
* <a href="http://docs.halodot.io/docs/documentations/sdk/branding-guidelines" target="_blank">Branding Guidelines</a>
