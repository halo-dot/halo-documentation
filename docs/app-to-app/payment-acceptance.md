
## Transactions/Payments Acceptance using Android Intents

Integration with Halo.Go application for transactions using Android Intent Mechanism.

We provide a sample code to help you with the intent request function call. The code is available on <a href="https://github.com/" target="_blank" >GitHub</a>.

>   Note: Experience with Android development is advised

<br/>

### Initiate an Intent Transaction

Retrieve a ```Transaction ID``` and payment ```JWT``` by hitting the endpoint below. You will need the API Key and ```Merchant
ID``` from the previous step for this API call.

<br/>

#### Post

```bash
{{POST_URL}}
```

The Call to initiate an Intent Transaction.

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
| packageName* | String | Identifier of the app |

<br/>

#### Response

200: OK Intent Transaction JWT

The response will contain a Transaction ID and JWT Token that will be used in the Intent call

Please see the example of the response body below:

```json
{

    "id": "ffe12ca8-61e6-48f9-b89c-537818652988",
    "token":"eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJ1c3IiOiJoYWxvIiwiY
     XVkX2ZpbmdlcnByaW50cyI6InNoYTI1Ni96YzZjOTdKaEtQWlVhK3JJE..."
}
```
<br/>

#### Send an Intent Request to the Halo Dot Go App

Initialise the transaction through the **startActivityForResult(Intent, int)** function as shown in the sample app.
