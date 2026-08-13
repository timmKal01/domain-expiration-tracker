# Domain Expiration Tracker — Registrar, Dates & Status

Check registration date, expiration date, days until expiry, registrar,
nameservers, and status for a list of domains — via the official RDAP
protocol, the modern IANA-standardized successor to WHOIS.

Built for IT teams managing a domain portfolio (catching renewals before
they lapse), brand/security teams watching for lapsed-domain takeover
risk, and anyone checking whether a domain is available.

## Input

```json
{
  "domains": ["google.com", "thisdomaindefinitelydoesnotexist12345xyz.com"]
}
```

| Field | Type | Description |
|---|---|---|
| `domains` | array of strings | Domains to check, without protocol or `"www."`. One lookup is billed per domain. |

## Output

One record per domain:

```json
{
  "domain": "google.com",
  "registered": true,
  "registrar": "MarkMonitor Inc.",
  "creationDate": "1997-09-15T04:00:00Z",
  "expirationDate": "2028-09-14T04:00:00Z",
  "daysUntilExpiration": 762,
  "lastChangedDate": "2019-09-09T15:39:04Z",
  "statuses": ["client delete prohibited", "client transfer prohibited", "client update prohibited"],
  "nameservers": ["NS1.GOOGLE.COM", "NS2.GOOGLE.COM", "NS3.GOOGLE.COM", "NS4.GOOGLE.COM"],
  "rdapUrl": "https://rdap.verisign.com/com/v1/domain/google.com"
}
```

An unregistered/available domain returns `"registered": false` with the
other fields `null` — still billed once, since a completed availability
check is the result either way.

## How it works

Direct calls to the official [RDAP](https://www.icann.org/rdap) protocol:
looks up the correct registry server per domain via the [IANA RDAP
bootstrap registry](https://data.iana.org/rdap/dns.json), then queries it
directly. No proxy, no key, no scraping.

**Coverage note:** RDAP is mandatory for ICANN-accredited gTLDs (`.com`,
`.net`, `.org`, `.info`, `.dev`, `.app`, and most others) but optional for
ccTLDs — a handful (e.g. `.co`, `.us`) don't publish an RDAP server yet
and will return a clear error instead of a result.

## Pricing note

Billed per **domain checked**, not per field returned — one charge per
domain whether it's registered or available.

## Related products

- [Certificate Transparency Monitor](https://github.com/timmKal01/certificate-transparency-monitor) — new TLS certificates issued for a domain, a different signal than registration/expiration
