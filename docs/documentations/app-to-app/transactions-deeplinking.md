
## Transactions/Payments Acceptance using Deeplinking

Integration with Halo.Go application for transactions using Deeplinking.

<br/>

### Initiate a Deeplink Transaction

Retrieve a ```Transaction URL``` and ```Reference``` by hitting the endpoint below. You will need the ```API Key``` and ```Merchant
ID``` from the previous step for this API call.

<br/>

#### Post

```bash
{{POST_URL}}
```

The Call to initiate a Deeplink Transaction.

<br/>

#### Headers

| Name |Type | Description |
| ----------- | ----------- |-------------|
| Content-Type* | String | Content Type of The Request: application/json|
| x-api-key| String | The API Key retrieved from the Merchant Portal|

<br/>

#### Request Body

| Name |Type | Description |
| ----------- | ----------- |-------------|
| merchantId* | Integer | Merchant ID from Merchant Portal|
| paymentReference*| String | Reference of the transaction|
| amount* |Integer | Amount of the transaction|
| timestamp* | String | ISO Standard Timestamp |
| currencyCode* | String | ISO Standard Currency Codes |
| isConsumerApp* | Boolean | Indicate if the call is for a Consumer App |
| Image* | JSON | Set to true to generate a QR code - ("required*: false")|



Please see the example of the request body below:

```
{
    "merchantId": "[your_merchant_id]",
    "paymentReference": "[your_payment_reference]",
    "amount": [your_payment_amount],
    "timestamp":"Thu Aug 25 09:43:59 SAST 2022",
    "currencyCode": "ZAR",
    "isConsumerApp": false,
    "Image": {
        "required": false
    }
}
```

<br/>

#### Response

200: OK URL to invoke the Halo Dot Application for a payment
<br/>
The response will contain a Transaction URL and Payment Reference that will be used in the intent call.

Please see the example of the response body below:

```json
{

    "url": "https://halompos.page.link/DYfL4EZEzvAzBfBAS",
    "reference":"c9e1were-8156-444c-894d-e065d71366a6"
}
```

<br/>

#### Use the Generated URL to Call the Halo Dot Go App

The generated link returned by the API call can then be used to invoke the Halo Dot Go application and start process transactions