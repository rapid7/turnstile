---
layout: default
title: Signing Specification

icon: lock
order: 200
---

# {{ page.title }}

For every non-localhost network connection, both peers MUST validate the identity of the remote peer.

For the purpose of this specification, a Connection is assumed to be of the stateful client/server variety (e.g. TCP), in which a Client initiates a Connection to a Server by performing a synchronization handshake.

This is one section of a larger document outlining point-to-point cryptography requirements for connection-oriented network traffic. See [the gist] for the complete proposal.

## 1. Authentication of Servers

Clients MUST enforce x.509 Path Validation as defined by [RFC 5280 Section 6.1]. This process SHOULD be performed by the Client's TLS implementation, and SHOULD NOT require additional software or configuration beyond definition of trust anchors (e.g. trusted root CA certificates for the environment)

x.509 Path Validation is sufficient for authentication of Server endpoints because the Client SHOULD NOT need to reason about Servers' identities and roles at request time.

## 2. Authentication of Clients

Servers MUST validate identification factors in incoming requests from Clients. This implies that Clients MUST provide a set of identification factors in every request.

### 2.1. Issues with TLS client-certificate-verify

Servers MUST NOT enforce the client-certificate-verify TLS extension. x.509 Path Validation is not sufficient for authentication of Client endpoints because Servers MUST reason about the identity and role of clients to implement role-based access controls.

Relying upon the client identity of a TLS session for identification requires:

* All TLS sessions to be end-to-end and terminated on Server instances.
* All client's initiate TLS sessions with signed certificates from well-organized PKIs.

These requirements for client-certificate-verify preclude the use of load balancers that terminate SSL, and the use of long-lived publicly signed certificates, which can't be safely distributed to ephemeral instances.

### 2.2. HTTP Client Identification Factors

Clients MUST implement an Authorization header scheme as defined by [RFC 7235 Section 4.1], with the non-standard scheme `Rapid7-V1-HMAC-SHA256`. This specification MAY be expanded in the future to support additional schemes.

    Authorization := "Authorization" ":" "Rapid7-HMAC-V1-SHA256" #(auth-params)
    auth-params := Base64<#(key-identity):#(signature)>

For the `Rapid7-HMAC-V1-SHA256` scheme, an HMAC algorithm, defined by [RFC 2104], using a SHA256 hashing function is used to generate a Base64-encoded signature:

    signature := Base64<HMAC-SHA256<#(key-secret), #(challenge-body)>>

The `key-identity` and `key-secret` parameters are a unique pair of identification factors provisioned out-of-band for each Client. `key-identity` is a public identifier that is used by validators to look up the Client's `key-secret` values.

Clients' `key-secret` values MUST only be known by the key's owner Client, and a validation service, which Servers MUST use to validate incoming requests.

    NOTE: As an interim solution before a validation service is deployed, Servers will have a set of Client keys and perform validation locally.

### 2.3. `Rapid7-HMAC-V1-SHA256` Signature Challenge Structure

The custom `Rapid7-HMAC-V1-SHA256` HTTP Authorization scheme is an HMAC-SHA256 signature of "directional" parameters in HTTP requests. These are parameters that change the meaning of the request when processed by the receiving Server.

    challenge-body := (method SP request-uri LF
                       host-header LF
                       date-header LF
                       key-identity LF
                       instance-digest LF
                       additional-headers)

#### Method and Request-URI

HTTP request Method and Request-URI are the primary directional factors that a server uses to route a request. Signatures MUST be explicitly bound to a single Method/Request-URI.

_NOTE that the Request-URI includes both path and query components._ While some servers may not make use of query parameters, _we cannot rule out_ the possibility that any server may change it's behavior based upon one or more query parameters, thus the signature MUST be bound to the request's query field:

`method` is the uppercase ASCII string representation of the signed request's HTTP Method as defined in [RFC 2616] Section 5.1.1

`request-uri` is the byte-value `Request-URI` from the signed request's `Request-Line` as defined in [RFC 2616] Section 5.1.2. The `request-uri` MUST be passed into the challenge structure as it was received off of or written to the wire, e.g. no normalization has occurred, the query filed has not been parsed and/or reordered, and no URL encoding/decoding has been performed upon the string.

#### Host Header

The Host header is required for all HTTP/1.1 requests. It MAY be used by load balancers or proxies to route the request to the correct server instance or cluster, thus the signature MUST be explicitly bound to a single Host resource:

`host-header` is the byte-value of the `field-value` of the Host header from the signed request as defined in [RFC 2616] Section 14.23. Similar to the `request-uri`, the `field-value` of the host header should be signed as it was received off of or written to the wire.

#### Date Header

A signature MUST have a bounded validity window on the order of minutes. The exact skew limit MAY vary depending upon how closely Clients' and Servers' clocks can be synchronized. Clients MUST include a date header with second precision as defined by [RFC 2616] Section 3.3.1:

  HTTP-date := rfc1123-date | rfc850-date | asctime-date

The signature MUST be bound to a canonical representation of the exact date encoded in the signed request's Date header. To ensure consistency across languages and platforms, this MUST be an ASCII encoded UNIX epoch timestamp, to millisecond precision:

    date-header := UNIX_Epoch_Seconds<HTTP-date> * 1000

NOTE that this conversion ensures consistency across language's HTTP implementations that may attempt to he helpful by parsing the Date header into a structure that is not the original wire-format string.

NOTE that some languages' Date libraries may generate millisecond-precision epoch timestamps by default, while others only generate second-precision values. Requiring conversion to milliseconds rather than seconds generally implies multiplication, which should not result in loss of precision in floating-point implementations, while division _may_ result in loss of precision that would invalidate the signature in non-deterministic ways.

#### Key Identity

A Key Identity is bound 1-to-1 to a Key Secret used by the HMAC algorithm to sign the challenge body. While extremely unlikely under normal circumstances, it is possible for two Key Identities are provisioned with the same secret. There are also an array of conceivable degradation attacks in which an attacker could deplete or manipulate a VM's entropy pool and raise the probability of secret collisions to an exploitable level.

To counter this vector, the signature MUST be explicitly bound to its Key Identity. `key-identity` is the Client's Key Identity string.

#### Instance Digest

Requests MUST include an [RFC 3230 Section 4.3.2] compliant Digest header:

    digest-header := ("Digest" ":" instance-digest)
    instance-digest := (algorithm "=" signature)
    algorithm := "SHA1" | "SHA256" | "SHA512"

The Digest header's field-value includes both the algorithm and the generated signature value. This allows the Client and Server to negotiate the algorithm used to generate the digest signature.

Algorithms known to be easily manipulated MUST be banned by service implementations.

The algorithm MUST be specified in UPPERCASE.

The signature MUST include the `instance-digest` field.

#### Additional Headers

Some HTTP services may utilize additional headers to alter request processing. These services SHOULD require that any headers other than the Host and Date headers that alter request handling be included in the signature's `additional-header-data` field.

    additional-headers := (field-name ":" field-values [LF additional-header-data])
    field-values := (field-value ["," field-values])

The `additional-headers` field is an ordered set of name/value pairs, new-line delimited, ordered lexicologically by `field-name`.

`field-name` is a lowercased ASCII representation of the corresponding `message-header` name.

`field-values` is a comma-separated list of the corresponding header values, should more than one header exist, ordered lexicologically.

Clients MUST include required additional headers with an empty ("") `field-value` if the signed request does not include the required additional header.

## 3. Authentication Process

... TODO details of the validation process.

* Validation MUST check that the request's Date header is within SKEW-LIMIT of the Server's system time before processing the Authorization header.
* Validation MUST check that the request's Digest signature matches the hash-sum of the body-content before processing the Authorization header.
* Processing of the Authorization header MUST implement a fixed-time comparison routine.

[RFC 2104]: https://tools.ietf.org/html/rfc2104
[RFC 2616]: https://tools.ietf.org/html/rfc2616
[RFC 3230 Section 4.3.2]: https://tools.ietf.org/html/rfc3230#section-4.3.2
[RFC 5280 Section 6.1]: https://tools.ietf.org/html/rfc5280#section-6.1
[RFC 7235 Section 4.1]: https://tools.ietf.org/html/rfc7235#section-4.2
[RSA vs. ECDSA]: https://blog.cloudflare.com/ecdsa-the-digital-signature-algorithm-of-a-better-internet/

[the gist]: https://gist.github.com/jmanero-r7/9c4ffe2e18297c7c7ef8a57abf12e4cb
