import { Actor, log } from 'apify';
import { lookupDomain } from './rdap.js';

await Actor.init();

const input = (await Actor.getInput()) ?? {};
const { domains = [] } = input;

if (domains.length === 0) {
    throw new Error('No domains provided.');
}

/** Must match the event name configured in this Actor's pay-per-event pricing on Apify. */
const DOMAIN_CHECKED_EVENT = 'domain-checked';

for (const domain of domains) {
    let record;
    try {
        record = await lookupDomain(domain.trim().toLowerCase());
    } catch (err) {
        log.warning(`Failed to look up domain`, { domain, error: err.message });
        continue;
    }

    await Actor.pushData(record);
    await Actor.charge({ eventName: DOMAIN_CHECKED_EVENT });

    log.info(`Checked domain`, { domain, registered: record.registered, daysUntilExpiration: record.daysUntilExpiration });
}

await Actor.exit();
