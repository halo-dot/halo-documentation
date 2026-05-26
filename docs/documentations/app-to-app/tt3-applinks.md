
## TT3/DebiCheck using Applinks

Integration with Halo.Go application for transactions using Applinks.

### Initiate an Applinks Transaction

Retrieve a ```Transaction URL``` by hitting the endpoint below. You will need the ```API Key``` and ```Merchant
ID``` from the previous step for this API call.

#### Post

```bash
{{POST_URL}}
```

The Call to initiate a TT3 Applinks Transaction.

#### Request Body

| Name |Type | Description |
| ----------- | ----------- |-------------|
| merchantId* | Integer | Merchant ID from Merchant Portal|
| id* | String | ID number of the account holder |
| accountNumber*| String | Account Number of the Debit Order |
| maxCollectionAmount |Integer | Max amount of the Debit Order (Cents e.g. 10000 = R100)|
| timestamp* | String | ISO Standard Timestamp |
| contractReference* | Boolean | contractReference |
| Image* | JSON | Set to true to generate a QR code - ("required*: false")|
| isConsumerApp | Boolean | Indicate if the call is for a Consumer App |
| collectionDay* | Number | Debit order day |
| CreditorABSN* | String | Description of Insurer (e.g. Name of insurer)|

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

The generated link returned by the API call can then be used to invoke the Halo Dot Go application and start process transactions.