const UA = 'DomainExpirationTracker/0.1 (+contact: domain-tracker-admin@example.com)';
const BOOTSTRAP_URL = 'https://data.iana.org/rdap/dns.json';

let bootstrapPromise = null;

async function loadBootstrap() {
    if (!bootstrapPromise) {
        bootstrapPromise = fetch(BOOTSTRAP_URL, { headers: { 'User-Agent': UA } })
            .then((res) => {
                if (!res.ok) throw new Error(`Failed to load IANA RDAP bootstrap registry: ${res.status}`);
                return res.json();
            })
            .then((data) => data.services);
    }
    return bootstrapPromise;
}

async function rdapBaseUrlFor(domain) {
    const tld = domain.split('.').pop().toLowerCase();
    const services = await loadBootstrap();
    const entry = services.find((s) => s[0].includes(tld));
    if (!entry) throw new Error(`No RDAP server registered for ".${tld}" (not all TLDs support RDAP)`);
    return entry[1][0].replace(/\/$/, '');
}

function findEvent(events, action) {
    return events?.find((e) => e.eventAction === action)?.eventDate ?? null;
}

export async function lookupDomain(domain) {
    const baseUrl = await rdapBaseUrlFor(domain);
    const res = await fetch(`${baseUrl}/domain/${encodeURIComponent(domain)}`, {
        headers: { 'User-Agent': UA, Accept: 'application/rdap+json' },
    });

    if (res.status === 404) {
        return { domain, registered: false, registrar: null, creationDate: null, expirationDate: null, daysUntilExpiration: null, lastChangedDate: null, statuses: [], nameservers: [], rdapUrl: `${baseUrl}/domain/${domain}` };
    }
    if (!res.ok) throw new Error(`RDAP lookup failed for ${domain}: ${res.status}`);

    const data = await res.json();

    const registrarEntity = data.entities?.find((e) => e.roles?.includes('registrar'));
    const registrarName = registrarEntity?.vcardArray?.[1]?.find((f) => f[0] === 'fn')?.[3] ?? registrarEntity?.publicIds?.[0]?.identifier ?? null;

    const expirationDate = findEvent(data.events, 'expiration');
    const daysUntilExpiration = expirationDate
        ? Math.round((new Date(expirationDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
        : null;

    return {
        domain,
        registered: true,
        registrar: registrarName,
        creationDate: findEvent(data.events, 'registration'),
        expirationDate,
        daysUntilExpiration,
        lastChangedDate: findEvent(data.events, 'last changed'),
        statuses: data.status ?? [],
        nameservers: (data.nameservers ?? []).map((ns) => ns.ldhName).filter(Boolean),
        rdapUrl: `${baseUrl}/domain/${domain}`,
    };
}
