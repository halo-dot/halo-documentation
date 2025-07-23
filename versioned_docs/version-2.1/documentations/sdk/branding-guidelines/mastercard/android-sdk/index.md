# Android SDK

Mastercard provides a lightweight Android SDK that helps you to implement and play Mastercard Sonic Branding Sound and/or Animation along with haptics feedback for multisensory confirmation. The Android SDK supports the following three features which you can select and integrate into your application.

> * Sound and Animation
> * Sound Only
> * Animation Only

### Supported Version <a href="#supported-version" id="supported-version"></a>

> API 21 and above

### Supported Version for Haptics Feedback <a href="#supported-version-for-haptics-feedback" id="supported-version-for-haptics-feedback"></a>

> API 26 and above

### Supported Language <a href="#supported-language" id="supported-language"></a>

> * Kotlin
> * Java

### Supported Platform <a href="#supported-platform" id="supported-platform"></a>

> * Android-based Point of Sale(POS) terminal
> * Mobile Application

## Download SDK <a href="#download-sdk" id="download-sdk"></a>

The Android SDK can be downloaded below.\

:::info
[Click here to download Android SDK](/files/sonic-sdk-release-1.5.0.aar)
:::

#### Adding Dependency with Gradle <a href="#adding-dependency-with-gradle" id="adding-dependency-with-gradle"></a>

AAR files can be added as a dependency in the project by following either of the methods mentioned below:\


* **Adding AAR as a New Module**

1. Go to **File -> New -> New module** and import the .jar/.aar package.
2. Configure the project build.gradle file.

```groovy
dependencies{
  implementation project(path: ':sonic-sdk-release')
}
```

* **Adding AAR in a Project Lib folder**

1. Copy the sonic-sdk-release-1.5.0.aar into the project libs folder.
2. Configure the project build.gradle file.

```groovy
repositories {
  flatDir {
    dirs 'libs'
  }
}
dependencies {
  implementation fileTree(dir: 'libs', include: ['*.jar'])
  implementation (name: 'sonic-sdk-release-1.5.0', ext: 'aar')
}
```

## Next Step <a href="#next-step" id="next-step"></a>

For detailed integration guide, see [Steps to Integrate](./android-sdk/steps-to-integrate/)
