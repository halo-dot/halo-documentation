# Integrator Merchant



## Create Integrator Merchant

<mark style={{color:'blue'}}>`POST`</mark> `https://appserver.{env}.haloplus.io/integrator/merchants`

Create a new merchant

#### Path Parameters

| Name                                  | Type   | Description                              |
| ------------------------------------- | ------ | ---------------------------------------- |
| env<mark style={{color:'red'}}>\*</mark> | String | The backend environment \[dev, qa, prod] |

#### headers

| Name                                           | Type   | Description                           |
| ---------------------------------------------- | ------ | ------------------------------------- |
| x-api-header<mark style={{color:'red'}}>\*</mark> | String | The API Key retrieved from the Portal |

#### Request Body

| Name                                                     | Type        | Description                   |
| -------------------------------------------------------- | ----------- | ----------------------------- |
| entityName<mark style={{color:'red'}}>\*</mark>             | String      | Name of a merchant            |
| mcc                                                      | Number      | Merchant Category Code        |
| address                                                  | JSON Object | Address of a merchant         |
| paymentProviderDetails<mark style={{color:'red'}}>\*</mark> | JSON Object | Details of a payment Provider |

```json
// Example of Request Body
{
  "entityName": "synthesis",
  "mcc": 100,
  "address": {
    "addressLines":["123 Main St","Cityville"],
    "postalCode": "2000",
    "state":"Gauteng",
    "country": "SA"
  },
  "paymentProviderDetails": {
        "type": "iveri",
        "details": {
            "appId": "D8208288-E869-4726-B198-364D66EC9243",
            "userId": "f10bddbf-117f-44a7-9e53-b0ea105b02a4"
        }
    }
}
```

#### Response Body

| Name       | Type   | Description                  |
| ---------- | ------ | ---------------------------- |
| merchantId | String | ID of a new xreated merchant |

```json
// Example of Response Body
// 200: OK Status code
{
    "merchantId": "2a9812ab-963a-4075-8ed6-e5d38f026233"
}
```

