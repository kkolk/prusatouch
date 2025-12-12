# Why We Must Implement Digest Authentication Ourselves (and Not Rely on Existing Libraries)

PrusaLink uses **HTTP Digest Authentication**, but its implementation
differs just enough from the RFC standard that most digest-auth
libraries fail in practice. Multiple tested libraries in Node, Python,
and browser-compatible environments result in repeated **401
Unauthorized** responses, broken handshakes, or incomplete header
generation.

This document explains **why no existing library is reliable**, and why
a **custom digest implementation** is required.

------------------------------------------------------------------------

## 1. PrusaLink's Digest Auth Is Not Fully RFC-Compliant

Although Digest Auth is defined in RFC 7616, PrusaLink deviates in
several important ways:

### 1.1 Unusual or inconsistent `qop` values

-   PrusaLink typically offers only:

        qop="auth"

-   Many libraries expect:

    -   multiple qop values (e.g., `"auth,auth-int"`), or\
    -   support for `"auth-int"`, or\
    -   strict formatting (comma-separated list).

Libraries that don't see RFC-standard patterns generate the wrong
`response` hash.

### 1.2 Nonces expire aggressively

PrusaLink rotates or invalidates the `nonce` frequently.

Most digest libraries: - assume nonce is long-lived, - fail to detect
the `stale=true` indicator, - or don't automatically restart the
handshake.

Result: infinite 401 → retry → 401 loops.

### 1.3 Missing or simplified fields

PrusaLink often omits fields such as: - `algorithm` - extended qop
options - MD5-sess support

Libraries that assume these fields exist create malformed Authorization
headers.

------------------------------------------------------------------------

## 2. Digest Libraries Hide Internal State We Must Control

Our proxy must: - Capture the `WWW-Authenticate` challenge - Parse all
digest components - Compute the correct MD5 values - Manage: - `nonce` -
`cnonce` - `nc` (nonce count) - Detect and handle `stale=true` - Retry
once with a new digest header - Cache valid nonces for subsequent
requests

Most libraries: - do not expose nonce / nc / cnonce state, - don't allow
manual overrides, - or try to manage the handshake internally
(incorrectly for PrusaLink).

Because we're building a **transparent proxy**, we need **full control**
over the handshake---something existing libraries don't provide.

------------------------------------------------------------------------

## 3. Browser Environments Cannot Modify Digest Headers

If prusatouch runs in a browser or Chromium kiosk, it cannot: - manually
construct `Authorization: Digest ...`, - control the nonce count, - or
override the default digest behavior.

Browsers implement their own internal digest workflow, which **cannot be
intercepted or corrected**.

Thus the proxy must manually produce the digest header before sending
the request to the printer.

------------------------------------------------------------------------

## 4. Existing Digest Libraries Produce Incorrect Hashes for PrusaLink

Common failures observed during testing include: - Incorrect HA1 / HA2
computation - Wrong handling of missing `algorithm` - Failure to include
or increment `nc` - Incorrect `cnonce` generation - Improper quoting or
escaping of parameters - Sending `qop="auth-int"` when PrusaLink only
supports `"auth"`

Each of these results in repeatable 401 failures.

------------------------------------------------------------------------

## 5. A Custom Digest Implementation Is Simple and Reliable

Despite the problems with libraries, the actual digest logic is
straightforward:

    HA1 = MD5(username:realm:password)
    HA2 = MD5(method:uri)
    response = MD5(HA1:nonce:nc:cnonce:qop:HA2)

Once we handle: - parsing, - nonce caching, - stale nonce refresh, -
nc/cnonce management,

...the proxy works consistently.

The reliable solution is: - manually parse the challenge, - manually
compute the hash, - and manually construct the `Authorization: Digest`
header.

This avoids all bugs in existing digest-auth libraries and matches
PrusaLink's actual behavior.

------------------------------------------------------------------------

## Conclusion

Because PrusaLink's Digest Auth: - deviates from the RFC, - expires
nonces aggressively, - omits fields required by libraries, - behaves
differently than typical web servers, - and requires fine-grained state
management,

**no off-the-shelf digest library can handle it reliably.**

A custom digest implementation gives us: - full control over the
handshake, - predictable behavior, - correct handling of PrusaLink
quirks, - and stable request authentication.

For this reason, **we must implement Digest Auth ourselves** instead of
relying on third-party libraries.
