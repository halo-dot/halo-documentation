# Authentication

In order to interact with any of the API endpoints, you must provide your API key as part of the request. You can find your secret key in the [Halo.Go Portal ](https://go.merchantportal.prod.haloplus.io/auth/login)after signing up.\
From the  Portal, navigate to Users. \
In the user table click generate to create  your `API Key`&#x20;

The API key should be included in the header of the API request. You can provide the secret key by using [API Keys](https://swagger.io/docs/specification/authentication/api-keys/) and the `Headers`. To do this, prepend X-API-Key to the secret key and insert it into the `Headers.`

```
Headers: X-API-Key <abcdef12345>
```

:::warning
Your API keys are used to identify you and enable payments, so be sure to keep them safe. Never share your secret key or publish it in code, such as on GitHub. All API requests must be made over [HTTPS](http://en.wikipedia.org/wiki/HTTP_Secure).
:::



