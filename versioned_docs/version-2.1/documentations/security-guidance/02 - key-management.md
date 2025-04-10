# Key Management

## **Key Management**

The security of the SDK is partly dependent on the security of the JWT that is used. The SDK relies on the JWT to identify the user, the correct backend as well as the certificate PIN that is used to prevent man-in-the-middle attacks. Thus, it is important that the signing key is protected sufficiently.

### **Generation**

An RSA 4096 key is recommended for signing JWTs. If possible, the key should be generated in an HSM. This will however require the HSM to sign all JWTs, which may not be feasible. An alternative solution is to use a cloud service that is backed by an HSM (for example, AWS KMS). Another alternative is to generate the key pair in software in a secure environment (e.g., an air gapped server) and then use an HSM to encrypt the private key at rest. This way, the key is only in the clear in memory in the server that will be issuing JWTs.

It is important to note that if the private key is ever compromised or rotated, Halo Dot should be notified so that we may take action to remove the signing key from our side.

### **Sharing of the public key**

Halo Dot requires the public key to be able to validate JWTs. The public key does not need to be encrypted, but it is important to maintain the integrity of the key. There are 2 methods that can be used to support this.

#### **Share public key as an x509 certificate**

This is the preferred way of sharing the key, as it provides a means of validating the key. Either a public CA can be used, or a CA certificate can be shared out of band that will be used to validate the JWT certificate.

#### **Share public key as a PEM file + sha256 hash**

If it is not possible to share a certificate, the public key can be shared in PEM format - this should be shared out of band (e.g., over email). Additionally, a sha-256 hash of the key should also be shared over another channel (e.g., over WhatsApp or text). This will allow us to validate the integrity of the key.
