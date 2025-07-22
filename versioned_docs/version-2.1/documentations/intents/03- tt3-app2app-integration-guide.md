---
description: >-
  Integration with Halo.Go application for TT3 Transactions using Android Intent
  Mechanisms or Deep linking.
---

# TT3 App to App Integration Guide

A **TT3 transaction**, in the context of banking, refers to a specific type of **debit order mandate authentication**. It's used for setting up recurring payments, like subscriptions or loan repayments.

## 1. Android Intents Mechanism

Steps in this section:

1. Retrieve a `Transaction ID` and payment `JWT` from the Halo Backend (see [here](https://halo-dot-developer-docs.gitbook.io/halo-dot/readme/1.-getting-started#id-2.-intent-authorization) how to get them).
2. Send an Intent Request to the Halo Dot Go application.

**1. Retrieve Transaction ID and JWT from Halo Backend**

Step two of Android Intents Mechanism integration is to initialize the transaction on the Halo Dot backend through an API request. You will need the `API Key` and `Merchant ID` from the previous step for this API call. The response will contain a `Transaction ID` and `JWT Token` that will be used in the third and final step.

_**Let’s take a closer look at the API request.**_&#x20;

### Intent Transaction

<mark style={{color:'green'}}>`POST`</mark> `https://kernelserver.{env}.haloplus.io/consumer/tt3IntentTransaction`

The call to the Halo Dot Backend to initiate a TT3 Intent Transaction.

#### Path Parameters

| Name                                      | Type   | Description                              |
| ----------------------------------------- | ------ | ---------------------------------------- |
| env<mark style={{color:'red'}}>\*</mark>     | String | The backend environment \[dev, qa, prod] |

#### Headers

| Name                                           | Type   | Description                                    |
| ---------------------------------------------- | ------ | ---------------------------------------------- |
| Content-Type<mark style={{color:'red'}}>\*</mark> | String | Content Type of the Request: application/json  |
| x-api-key<mark style={{color:'red'}}>\*</mark>    | String | The API Key retrieved from the Merchant Portal |

#### Request Body

| Name                                                  | Type    | Description                                                                                  |
| ----------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------- |
| merchantId<mark style={{color:'red'}}>\*</mark>          | Integer | Merchant ID from Merchant Portal                                                             |
| accountNumber<mark style={{color:'red'}}>\*</mark>       | String  | Account Number of the Debit Order                                                            |
| maxCollectionAmount<mark style={{color:'red'}}>\*</mark> | String  | Max amount of the Debit Order (e.g. 100.01)                                                  |
| timestamp<mark style={{color:'red'}}>\*</mark>           | String  | ISO Standard Timestamp                                                                       |
| contractReference<mark style={{color:'red'}}>\*</mark>   | String  | Reference of the Debit Order                                                                 |
| id                                                    | String  | ID number of the account holder                                                              |
| instalmentAmount                                      | String  | Instalment amount of the Debit Order (e.g. 100.01)                                           |
| instalmentVisibility                                  | Enum    | This field is to set what should be displayed to the user: both, maximumOnly, instalmentOnly |



```json
{
    "id": "ffe12ca8-61e6-48f9-b09c-537818652988",
    "token": "eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJ1c3IiOiJoYWxvIiwiYXVkX2ZpbmdlcnByaW50cyI6InNoYTI1Ni96YzZjOTdKaEtQWlVhK3JJclZxamtuREUxbERjREs3N0c0MXNEbysxYXkwPSIsImtza19waW4iOiJzaGEyNTYvMVpuYTRUNlBLY0ozS3EvZGJWeWxiOG42MmovQWRRWVV6V3JqLzRzazVROD0iLCJtZXJjaGFudElkIjozMTcsImlhdCI6MTY3NTMzMzQyMCwiZXhwIjoxNjc1MzM0MzIwLCJhdWQiOiJrZXJuZWxzZXJ2ZXIucWEuaGFsb3BsdXMuaW8iLCJpc3MiOiJhdXRoc2VydmVyLnFhLmhhbG9wbHVzLmlvIiwic3ViIjoiYzQwMWIxYTYtNDI5Ny00NDM1LTg3OWItMDAyNTZhY2E4N2NjIn0.fCsDOSlkOz2nqjAohFYZNIO6f5cp4xbLer6s4o9BVJckoPRwxShdQLBxOySoYhioZ2WaYWFO-qhxDQjQG8RsPYByGsgIgQtVRaudS_IGI4Xv0KG8p0A9isX8jlw8KEeZwEuaj-zHUg4DAO4n3ydVAd3NjM1oysMKUbdn5MmW-wH7keutNCKtq9qF_hF0A8s3rUCO8UsB5QuXzz18VfPFe6fs3LoOGMHiKvgRWlhpKhrfXWQAw8vpwCLeY58vfa8LFGixMS526322s_dGTxkKC5f366GBWgoqHDyporidblCy64T5MbgifL41kiXahNQs6B4eLmuWeUTosHQ6jUajiEsa61QnUY1K9Pv3kT7bFDYy4Hvu2mdktzpV2p6MpM9gH3E4LLZGKhOJLjkf8LP7NsE-h4aN1XlKHJmMex8yMaAgV-_wxLCDPrK0Q7KgKGTNRByi8HkluhYYuMlslXXjN13ff8alMxCEBeyrkubi_X-tlTeilSmEF1tbWZ4WYiUfbNNqsfFDBKfErQc8dpJz22ou2DxyBd8_esBG1aEv4c5dIPciu_i2vG6FQADW_CNHmc01UnfymyReatc1c0WzFQS_OmoS3yaxymnvlCY_pD_bcZUr-5s60IQnu1D1wCeRfM1QE6-xSJvWx7sbXpbdNGbv1_PFM4xQTsuE6fBxzis"
}
```



**2. Send an Intent Request to the Halo Dot Go**

We provide a sample code to help you with the intent request function call. \
The code is available on the [merchant portal](https://go.merchantportal.qa.haloplus.io/deeplinking) ⇒ Help Center => App to App menu item.

## 2. Deeplinking Mechanism

Steps in this section:

1. Retrieve the `Transaction URL` from the Halo Backend
2. Use the Generated URL to call the Halo Dot Go application.

**1. Retrieve the Transaction URL from the Halo Backend**

The last step of Deeplinking integration is to retrieve the URL from the Halo Dot backend through an API request. You will need the `API Key` and `Merchant ID` from Getting Started for this API call.

_**Let’s take a closer look at the API request.**_



### Transaction URL

<mark style={{color:'green'}}>`POST`</mark> `https://kernelserver.{env}.haloplus.io/consumer/tt3QRCode`

The call to the Halo Dot Backend to initiate an Intent Transaction and retrieve a Transaction URL that can be used to invoke the Halo Dot Link application

#### Path Parameters

| Name                                      | Type   | Description                              |
| ----------------------------------------- | ------ | ---------------------------------------- |
| env<mark style={{color:'red'}}>\*</mark>     | String | The backend environment \[dev, qa, prod] |

#### Headers

| Name                                           | Type   | Description                                    |
| ---------------------------------------------- | ------ | ---------------------------------------------- |
| Content-Type<mark style={{color:'red'}}>\*</mark> | String | Content Type of the Request: application/json  |
| x-api-key<mark style={{color:'red'}}>\*</mark>    | String | The API Key retrieved from the Merchant Portal |

#### Request Body

| Name                                                  | Type    | Description                                                                                  |
| ----------------------------------------------------- | ------- |----------------------------------------------------------------------------------------------|
| merchantId<mark style={{color:'red'}}>\*</mark>          | Integer | Merchant ID from Merchant Portal                                                             |
| id<mark style={{color:'red'}}>\*</mark>                  | String  | ID number of the account holder                                                              |
| accountNumber<mark style={{color:'red'}}>\*</mark>       | String  | Account Number of the Debit Order                                                            |
| maxCollectionAmount<mark style={{color:'red'}}>\*</mark> | String  | Max amount of the Debit Order (e.g. 100.01)                                                  |
| timestamp<mark style={{color:'red'}}>\*</mark>           | String  | ISO Standard Timestamp                                                                       |
| contractReference<mark style={{color:'red'}}>\*</mark>   | String  | contractReference                                                                            |
| image<mark style={{color:'red'}}>\*</mark>               | JSON    | Set to true to generate a QR code - \{"required": false\}                                    |
| isConsumerApp                                         | Boolean | Indicate if the call is for a Consumer App                                                   |
| collectionDay<mark style={{color:'red'}}>\*</mark>       | Number  | Debit order day                                                                              |
| CreditorABSN<mark style={{color:'red'}}>\*</mark>        | String  | Description of Insurer (e.g. Name of insurer)                                                |
| instalmentAmount                                      | String  | Instalment amount of the Debit Order (e.g. 100.01)                                           |
| instalmentVisibility                                  | Enum    | This field is to set what should be displayed to the user: both, maximumOnly, instalmentOnly |



```json
{
    "url": "https://halompos.page.link/DYfL4EZEzvB52fVNA",
    "reference": "c9e1debe-8156-444c-894d-e065d7169aa6"
}
```



**2. Use the Generated URL to call the Halo Dot Go application**

The generated link returned by the API call can then be used to invoke the Halo Dot Go application and start processing the transaction.

## 3. Applinking Mechanism

Steps in this section:

1. Retrieve the `Transaction URL` from the Halo Backend
2. Use the Generated URL to call the Halo Dot Go application.

**1. Retrieve the Transaction URL from the Halo Backend**

> **Note:** This endpoint replaces the deprecated `/consumer/tt3QRCode` endpoint.

The last step of the Applink integration is to retrieve the URL from the Halo Dot backend through an API request. You will need the `API Key` and `Merchant ID` from Getting Started for this API call.

_**Let’s take a closer look at the API request.**_



### Transaction URL

<mark style={{color:'green'}}>`POST`</mark> `https://kernelserver.{env}.haloplus.io/consumer/tt3Applink`

The call to the Halo Dot Backend to initiate an Applink Transaction and retrieve a Transaction URL that can be used to invoke the Halo Dot Link application

#### Path Parameters

| Name                                      | Type   | Description                              |
| ----------------------------------------- | ------ | ---------------------------------------- |
| env<mark style={{color:'red'}}>\*</mark>     | String | The backend environment \[dev, qa, prod] |

#### Headers

| Name                                           | Type   | Description                                    |
| ---------------------------------------------- | ------ | ---------------------------------------------- |
| Content-Type<mark style={{color:'red'}}>\*</mark> | String | Content Type of the Request: application/json  |
| x-api-key<mark style={{color:'red'}}>\*</mark>    | String | The API Key retrieved from the Merchant Portal |

#### Request Body

| Name                                                  | Type    | Description                                                                                  |
| ----------------------------------------------------- | ------- |----------------------------------------------------------------------------------------------|
| merchantId<mark style={{color:'red'}}>\*</mark>          | Integer | Merchant ID from Merchant Portal                                                             |
| id<mark style={{color:'red'}}>\*</mark>                  | String  | ID number of the account holder                                                              |
| accountNumber<mark style={{color:'red'}}>\*</mark>       | String  | Account Number of the Debit Order                                                            |
| maxCollectionAmount<mark style={{color:'red'}}>\*</mark> | String  | Max amount of the Debit Order (e.g. 100.01)                                                  |
| timestamp<mark style={{color:'red'}}>\*</mark>           | String  | ISO Standard Timestamp                                                                       |
| contractReference<mark style={{color:'red'}}>\*</mark>   | String  | contractReference                                                                            |
| image<mark style={{color:'red'}}>\*</mark>               | JSON    | Set to true to generate a QR code - \{"required": false\}                                    |
| isConsumerApp                                         | Boolean | Indicate if the call is for a Consumer App                                                   |
| collectionDay<mark style={{color:'red'}}>\*</mark>       | Number  | Debit order day                                                                              |
| CreditorABSN<mark style={{color:'red'}}>\*</mark>        | String  | Description of Insurer (e.g. Name of insurer)                                                |
| instalmentAmount                                      | String  | Instalment amount of the Debit Order (e.g. 100.01)                                           |
| instalmentVisibility                                  | Enum    | This field is to set what should be displayed to the user: both, maximumOnly, instalmentOnly |



```json
{
    "url": "https://go.merchantportal.dev.haloplus.io/c9e1debe-8156-444c-894d-e065d7169aa6?env=kernelserver.{env}.haloplus.io",
    "reference": "c9e1debe-8156-444c-894d-e065d7169aa6"
}
```



**2. Use the Generated URL to call the Halo Dot Go application**

The generated link returned by the API call can then be used to invoke the Halo Dot Go application and start processing the transaction.

## 4. Conclusion

That concludes the guide to integrating the Halo Dot Go into your application. For any questions, please do not hesitate to reach out to the Halo Dot Team.

Not what you were looking for? If you are looking for the Transaction Integration guide, it is over [here](/docs/versioned_docs/version-2.1/documentations/intents/transaction-app2app-integration-guide)
