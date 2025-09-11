
## TT3/Debicheck using Deeplinking

Integration with Halo.Go application for transactions using Deeplinking.

<br/>

### Initiate a Deeplink Transaction

Retrieve a ```Transaction URL``` by hitting the endpoint below. You will need the ```API Key``` and ```Merchant
ID``` from the previous step for this API call.

<br/>

#### Post

```bash
{{POST_URL}}
```

The Call to initiate a TT3 Deeplink Transaction.

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
| id* | String | ID number of the account holder |
| accountNumber*| String | Account Number of the Debit Order |
| maxCollectionAmount |Integer | Max amount of the Debit Order (Cents e.g. 10000 = R100)|
| timestamp* | String | ISO Standard Timestamp |
| contractReference* | Boolean | contractReference |
| Image* | JSON | Set to true to generate a QR code - ("required*: false")|
| isConsumerApp | Boolean | Indicate if the call is for a Consumer App |
| collectionDay* | Number | Debit order day |
| CreditorABSN* | String | Description of Insurer (e.g. Name of insurer)|



Please see the example of the request body below:

```
{
    "merchantId" : 499,
    "accountNumber": "1001009452",
    "collectionDay":"25",
    "creditorABSN":"Clientele",
    "id": "7703310666187",
    "maxCollectionAmount": "100",
    "contractReference": "retest6",
    "timestamp": "Thu Aug 25 09:43:59 SAST 2022",
    "isConsumerApp": false,
    "image": {
        "required": false
        }
}
```
<br/>

#### Response

201: Created URL to invoke the Halo Dot Application for a payment
<br/>
The response will contain a Transaction ID and JWT Token that will be used in the intent call.

Please see the example of the response body below:

```json
{

    "url": "https://halompos.page.link/DYfL4EZEzvAzBfBAS",
    "reference":"c9e1were-8156-444c-894d-e065d71366a6"
}
```
<br/>

#### Use the Generated URL to Call the Halo Dot Go App

The generated link returned by the API call can then be used to invoke the Halo Dot Go application and start process transactions.