---
description: >-
  Simply integrate with our Tap on Own Device API library and your customers can
  pay by tapping their own card or digital wallet on their own device!
---

# Create the Checkout

#### Halo Dot Plugin Integration Overview

Halo Dot is developing a solution that allows payment gateways to seamlessly integrate the **Halo Dot Plugin**, enabling them to offer an additional payment method to their merchants. This new payment method allows merchants' customers to tap their cards directly on their mobile devices to complete purchases.

#### Integration Overview

This documentation provides all the necessary steps for a payment gateway to integrate the Halo Dot Plugin into their payment methods. The integration can be performed in two ways:

1. **Direct Invocation on a Mobile Device**: The plugin is launched directly on the merchant's device, allowing customers to tap their card to make a payment.
2. **Web-Based Integration via QR Code**: If the plugin is integrated into a web page, a QR code is displayed. When scanned by the customer’s device, the Halo Dot Plugin is invoked, allowing the customer to tap their card on their own device.

#### Key Integration Features

* **Seamless Integration**: The process is designed to closely resemble the addition of a standard payment method. The only requirement for this payment method is that the customer must have the Halo Dot Plugin installed on their device, or they will be redirected to the Play Store to install it.
* **Payment Flow**:
  1. The payment session is initiated by the merchant server, similar to a typical payment method, with the shopper’s information sent to the gateway.
  2. The gateway then communicates with the Halo Dot backend, which responds with a secure deep link.
  3. This deep link, when clicked (via a button or QR code), opens the Halo Dot Plugin pre-authenticated and pre-populated with the transaction amount and payment details.
  4. The customer taps their card to complete the payment.

This integration is designed to provide payment service providers (PSPs) with all necessary steps and information to enable this new payment method.

## User Journey

<figure><img src="/img/user-journey-1.png" alt="" /><figcaption></figcaption></figure>

<figure><img src="/img/user-journey-2.png" alt="" /><figcaption></figcaption></figure>


**CAUTION**

The Tap on Own Device APIs should only be called from your server. This flow ensures the security of your payments and provides a trusted result to your server.


## How it works?

From an implementation perspective, the Halo Dot Plugin integration contains:

* **Server-side**: a single API call which creates the payment sessions.
* **Client-side**: The **Halo Dot Plugin** is installed on the device to attest its integrity and enable card tapping functionality, allowing the device to read the card and initiate a payment request.
* **Webhook server**: receives webhook notifications which tell you what is the outcome of each payment.

The payment flow is the same for all payments:

1. The shopper goes to the checkout page.
2. The merchant server passes the shopper information (Dependent on Gateway) from the consumer to your gateway to create a payment session.
3. Your gateway submits the the request (Dependent on Gateway) to the Halo Dot backend. The Halo Dot backend returns the URL to invoke the Halo Dot Plugin.&#x20;
4. When the link is selected or scanned the Halo Dot Plugin is invoked and the payment is processed.
5. A notification is sent to the gateway's webhook server containing the payment outcome in which the gateway will return the outcome through webhook, return URL or listening service.

<figure><img src="/img/how-it-works.png" alt="" /><figcaption></figcaption></figure>

## Steps

1. [Create the Checkout](create-the-checkout.md#1-create-the-checkout)
   * Display QR code
2. [Verify the payment is successful](create-the-checkout.md#2-verify-that-the-payment-is-successful)

### 1. Create the Checkout

The Checkout API requires authenticated access, see [here](../api-docs/01 - authentication) for more details.

A Checkout represents what your customer sees on the payment page, including the amount to collect, currency, and any other additional details. This interface displays the available checkout methods. For example, one of the checkout methods could be "Pay Contactless." To enable this, you would add an endpoint behind an action (such as a button) that creates the Tap on Own transaction request.

### Deeplink Transaction <a href="#deeplink-transaction" id="deeplink-transaction"></a>


<mark style={{color:'blue'}}>`POST`</mark> `https://kernelserver.prod.haloplus.io/consumer/qrCode`


The call to the Halo Dot Backend to retrieve a Transaction URL .

**Path Parameters**

| Name  | Type   | Description                              |
| ----- | ------ | ---------------------------------------- |
| env\* | String | The backend environment \[dev, qa, prod] |

**Headers**

| Name           | Type   | Description                                    |
| -------------- | ------ | ---------------------------------------------- |
| Content-Type\* | String | Content Type of the Request: application/json  |
| x-api-key\*    | String | The API Key retrieved from the Merchant Portal |

**Request Body**

| Name               | Type    | Description                                               |
| ------------------ | ------- |-----------------------------------------------------------|
| merchantId\*       | String  | Merchant ID from Merchant Portal                          |
| paymentReference\* | String  | Reference of the transaction                              |
| amount\*           | String  | Amount of the transaction (e.g. 100.01)                   |
| timestamp\*        | String  | ISO Standard Timestamp                                    |
| currencyCode\*     | String  | ISO Standard Currency Codes                               |
| isConsumerApp\*    | Boolean | Indicate if the call is for a Consumer App                |
| image\*            | JSON    | Set to true to generate a QR code - \{"required": false\} |

```json
{
    "merchantId" : "{Your MID}", 
    "paymentReference": "",
    "amount": 5, 
    "timestamp": "Thu Aug 25 09:43:59 SAST 2022", 
    "currencyCode": "ZAR",
    "isConsumerApp": false,
    "image": {
        "required": false
    }
}
```

**Sample response**

The deeplink transaction response contains a URL used to either redirect the customer to the tap screen if the transaction is occurring on the same device, or to display a QR code if the transaction is made on a different device. The URL is embedded in the QR code, and when scanned, it invokes the application to prompt the card tap.

200: OK URL to invoke the Halo Dot Application for a payment

```
{
    "url": "https://halompos.page.link/DYfL4EZEzvAzBfBAS",
    "reference": "c9e1were-8156-444c-894d-e065d71366a6"
}
```

### 2. Verify that the payment is Successful

When a payment is successful, we will send a webhook event to the url provided. It is highly recommended to use webhooks to check the payment status before fulfilling the order.

The status of the payment can be verified by referring to the `disposition` field of the webhook event. A payment is considered successful if its `disposition` is marked as `approved.`







[^1]: 
