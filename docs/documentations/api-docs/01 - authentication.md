# Authentication

## Users Managed by Halo Dot

Follow this process if if Halo Dot manages your users: 

In order to interact with any of the API endpoints, you must provide your API key as part of the request. You can find your secret key in the <a href="https://go.merchantportal.prod.haloplus.io/auth/login" target="_blank">Halo.Go Portal </a>after signing up.\
From the  Portal, navigate to Users. \
In the user table click generate to create  your `API Key`&#x20;

The API key should be included in the header of the API request. You can provide the secret key by using <a href="https://swagger.io/docs/specification/authentication/api-keys/" target="_blank">API Keys</a> and the `Headers`. To do this, prepend X-API-Key to the secret key and insert it into the `Headers.`

**Header:**
```
 x-api-key: <abcdef12345>
```

:::warning
Your API keys are used to identify you and enable payments, so be sure to keep them safe. Never share your secret key or publish it in code, such as on GitHub. All API requests must be made over [HTTPS](http://en.wikipedia.org/wiki/HTTP_Secure).
:::

## Users Managed by Your System

If you issue the tokens used to initialise the Halo Dot SDK, you can use the same tokens to authenticate API requests. To do this, include the token in the `Authorization` header of the API request. Prepend `Bearer` to the token and insert it into the `Headers.`

**Header:**
```
Authorization: Bearer <abcdef12345>
```

