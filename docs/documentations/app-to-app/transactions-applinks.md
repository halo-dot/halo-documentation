
## Transactions/Payments Acceptance using Applinks

Integration with Halo.Go application for transactions using Applinks.

### Initiate a Applinks Transaction

Retrieve a ```Transaction URL``` and ```Reference``` by hitting the endpoint below. You will need the ```API Key``` and ```Merchant
ID``` from the previous step for this API call.

#### Post

```bash
{{POST_URL}}
```

The Call to initiate a Applinks Transaction.

<hr />

#### Headers

| Name |Type | Description |
| ----------- | ----------- |-------------|
| Content-Type* | String | Content Type of The Request: application/json|
| x-api-key| String | The API Key retrieved from the Merchant Portal|

<hr />

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

#### Example Response

```json
{

    "url": "https://halompos.page.link/DYfL4EZEzvAzBfBAS",
    "reference":"c9e1were-8156-444c-894d-e065d71366a6",
    "qrCode": "data:image/png;base64,..."
}
```

<hr />

#### Use the Generated URL to Call the Halo Dot Go App

The generated link returned by the API call can then be used to invoke the Halo Dot Go application and start process transactions