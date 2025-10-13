# Android Reference App

## Overview <a href="#overview" id="overview"></a>

This section guides you through the process of building and integrating the Android SDK into the application. The application demonstrates the use case of a merchant application where Mastercard Checkout Sound and Animation is played by default on a transaction approval using a Mastercard card.\
The application is a stand-alone project that does not require any backend to perform end-to-end testing and it also provides details on how the code can be changed to demonstrate all three features of Mastercard Sonic Branding.

### Technologies used <a href="#technologies-used" id="technologies-used"></a>

* <a href="https://kotlinlang.org/docs/reference/android-overview.html" target="_blank">Kotlinopens in a new tab</a> version 1.8.20 to build
* <a href="https://services.gradle.org/distributions/" target="_blank">Gradleopens in a new tab</a> version 8.2.1 to build

## Get the source code <a href="#get-the-source-code" id="get-the-source-code"></a>

Reference Application for Android SDK can be downloaded below:

:::info
[Click here to download Android SDK](/files/sonic-app-android-1.5.0.zip)
:::

## What you will need <a href="#what-you-will-need" id="what-you-will-need"></a>

* A development environment set up with your IDE of choice, preferred is <a href="https://developer.android.com/studio/install" target="_blank">Android Studio | Flamingo 2022.2.1opens in a new tab</a>
* Android SDK version Lollipop and above

## What you will build <a href="#what-you-will-build" id="what-you-will-build"></a>

* A simple Android application that shows how Mastercard Checkout Sound and Animation is integrated into the merchant application.
* A merchant application that shows how Mastercard Checkout Sound and Animation is played on a transaction approval.

<figure><img src="../../../../.gitbook/assets/image.png" alt="" /><figcaption></figcaption></figure>

## What you will learn <a href="#what-you-will-learn" id="what-you-will-learn"></a>

*   **When to integrate Mastercard Checkout Sound and Animation**

    Integration of Android SDK can be done in a fragment where confirmation of checkout is handled. In reference application, refer code in `ConfirmOrderFragment` fragment which initializes the `SonicController`.



    ```kotlin
        private val sonicController = SonicController()

    ```
* **What changes are required to play different features of Mastercard Sonic Branding**

After the integration of Android SDK is completed, prepare the `SonicController` with `SonicType` at the creation of the confirmation view. Your controller is now prepared with the assets which are required to play the Checkout Sound and/or Animation. In reference application, refer in `prepareSonicAnimation` method of `ConfirmOrderFragment` fragment where you can provide a value of `SonicType` and can check different behaviours of Mastercard Sonic Brand.

```kotlin
       private fun prepareSonicAnimation() {

        sonicMerchant = SonicMerchant.Builder()
            .merchantName("Uber")
            .city("New York")
            .merchantCategoryCodes(arrayOf("MCC 5122"))
            .countryCode("USA")
            .merchantId("UberId")
            .build()

        /*
         * SonicEnvironment.SANDBOX: Please pass SANDBOX in prepare() while the application is in developing or testing.
         * SonicEnvironment.PRODUCTION: Please pass PRODUCTION when the application getting release to live users.
         */

        sonicController.prepare(sonicType = SonicType.SOUND_AND_ANIMATION,
            sonicCue = "checkout",
            sonicEnvironment = SonicEnvironment.SANDBOX,
            merchant = sonicMerchant,
            isHapticsEnabled = true,
            context = requireContext(),
            onPrepareListener = object : OnPrepareListener {
                override fun onPrepared(statusCode: Int) {
                    btnConfirmOrder.isEnabled = true
                    Log.d(TAG, "onPrepared() statusCode = $statusCode")
                }
            })
    }

```

*   **When to play Mastercard Checkout Sound and Animation**

    After the integration of Android SDK is completed and resources are prepared, wait for the transaction approval event. As soon as the transaction is approved, validate the Payment Network of Card account holder. For Mastercard, the Checkout Sound and/or Animation is played. In reference application, refer code in `paymentSuccess` method of `ConfirmOrderFragment` fragment which plays the Checkout Sound and/or Animation.



    ```kotlin
        private fun paymentSuccess() {
            if (dialogShown) {
                dialogShown = false
                orderGroup.visibility = View.GONE
                sonicView.visibility = View.VISIBLE

                if (getSelectedPaymentCard().type() != CardType.MASTERCARD) {
                    findNavController().navigate(R.id.action_confirmOrderFragment_to_thankYouFragment)
                } else {
                    sonicController.play(sonicView, object : OnCompleteListener {
                        override fun onComplete(statusCode: Int) {
                            Log.d(TAG, "onComplete() statusCode = $statusCode")
                            isSonicAnimationCompleted = true
                            findNavController().navigate(R.id.action_confirmOrderFragment_to_than
    ```
