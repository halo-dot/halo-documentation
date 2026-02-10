---
id: sample-application
sidebar_class_name: hidden
tags:
  - sdk
  - guides
---

# Sample Application

## 1. Download the Test App

Download our test app from <a href="https://github.com/halo-dot/test_app-android_sdk" target="_blank">GitHub</a> .

<br/>

2. **Configure The Test App**

    Open `test_app/app/src/main/java/za/co/synthesis/halo/halotestapp/Config.kt` and replace the placeholder values of `PRIVATE_KEY_PEM`, `ISSUER`, and `USERNAME` with your own values. You will need the private key you used to generate your public key, your issuer name, and your username (you can use the email or phone number used to register).

        ```kotlin
        object Config {
            const val PRIVATE_KEY_PEM = "{{YOUR_PRIVATE_KEY_PEM}}"
            const val ISSUER = "{{YOUR_ISSUER}}"
            const val USERNAME = "{{YOUR_USERNAME}}"
            const val MERCHANT_ID = "{{YOUR_MERCHANT_ID}}"
            const val HOST = "{{HOST}}"
            const val AUD = "{{AUD}}"
            const val KSK = "{{KSK}}"
        }
        ```

    Open the `local.properties` file and replace the placeholder values of `aws.accessKey` and `aws.secretKey`.<br/>
    These credentials are sensitive and should not be committed to source control. Add the credentials into a local.properties file:

        ```properties
        sdk.dir=~/Library/Android/sdk
        aws.accessKey=your_access_key
        aws.secretKey=your_secret_key
        ```

        `sdk.dir` specifies the location of the Android SDK on your file system.

<br/>

3. **Gradle Setup**

    Run a Gradle sync, this will download the SDK and configure Android Studio to build the test app


4. **Build & Run**

   In Android Studio, click the run button to build and run the test app on your device
   

5. **Testing**

    After running the application, wait for the application to initialize, you will be able to enter an amount and a transaction reference.

    Initially, you will be testing against a test environment and a test card is required to test the transaction.<br/>
    We recommend downloading the <a href="https://apkpure.com/visa-mobile-cdet/com.visa.app.cdet" target="_blank">Visa Contactless Device Evaluation Toolkit (CDET)</a> application.<br/>
    This is an Android-based mobile application that simulates virtual cards

    <hr/>
    
Now, you are ready to start using the Halo.SDK in your Android application!
