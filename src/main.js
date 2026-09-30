import { Actor, log } from 'apify';
import { lookupDomain } from './rdap.js';

await Actor.init();

const input = (await Actor.getInput()) ?? {};
let { domains } = input;

// An empty run (first click in the Console) should show a working example, not throw.
if (domains === undefined || (Array.isArray(domains) && domains.length === 0)) {
    domains = ['google.com'];
    log.info('No domains given; defaulting to the example "google.com".');
}
if (!Array.isArray(domains)) {
    throw new Error('Input "domains" must be an array of domains, e.g. ["example.com"].');
}

/** Must match the event name configured in this Actor's pay-per-event pricing on Apify. */
const DOMAIN_CHECKED_EVENT = 'domain-checked';

for (const entry of domains) {
    const domain = entry.trim().toLowerCase();
    let record;
    try {
        record = await lookupDomain(domain);
    } catch (err) {
        log.warning(`Failed to look up domain`, { domain, error: err.message });
        continue;
    }

    // `domain` is the registered domain that was looked up; `input` is what was entered.
    await Actor.pushData({ input: domain, ...record });
    await Actor.charge({ eventName: DOMAIN_CHECKED_EVENT });

    log.info(`Checked domain`, { domain, registered: record.registered, daysUntilExpiration: record.daysUntilExpiration });
}

await Actor.exit();
