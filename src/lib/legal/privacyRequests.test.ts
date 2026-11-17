import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPrivacyRequestRecord,
  JURISDICTION_SPECS,
  validatePrivacyRequestInput,
} from './privacyRequests';

test('privacyRequests (India DPDP Act, US CCPA/CPRA, EU GDPR & Global compliance)', async (t) => {
  await t.test('validates required fields and India Section 14 nominee requirements', () => {
    const invalid = validatePrivacyRequestInput({
      jurisdiction: 'india',
      requestType: 'nominate_representative',
      fullName: 'A',
      email: 'invalid-email',
      details: 'short',
      verifiedIdentity: false,
    });
    assert.equal(invalid.valid, false);
    assert.equal(invalid.errors.length, 5);

    const validIndiaNominee = validatePrivacyRequestInput({
      jurisdiction: 'india',
      requestType: 'nominate_representative',
      fullName: 'Aarav Sharma',
      email: 'aarav@example.in',
      details: 'Nominating representative under Section 14 of the DPDP Act 2023.',
      nomineeName: 'Priya Sharma',
      nomineeContact: 'priya@example.in',
      verifiedIdentity: true,
    });
    assert.equal(validIndiaNominee.valid, true);
    assert.equal(validIndiaNominee.errors.length, 0);
  });

  await t.test('calculates statutory 24h acknowledgement and 15-day resolution SLA for India DPDP / IT Rules', () => {
    const fixedNow = new Date('2026-11-13T12:00:00.000Z');
    const record = createPrivacyRequestRecord(
      {
        jurisdiction: 'india',
        requestType: 'grievance_redressal',
        fullName: 'Aarav Sharma',
        email: 'aarav@example.in',
        stateOrRegion: 'Maharashtra, India',
        details: 'Requesting formal access summary and grievance verification under DPDP Act.',
        verifiedIdentity: true,
      },
      fixedNow
    );

    assert.match(record.ticketId, /^FS-DPDP-2026-[A-Z0-9]{6}$/);
    assert.equal(record.ackDueBy, '2026-11-14T12:00:00.000Z'); // +24h per IT Rules 2021
    assert.equal(record.resolutionDueBy, '2026-11-28T12:00:00.000Z'); // +15 days per IT Rules / DPDP
    assert.ok(record.applicableLaw.includes('Digital Personal Data Protection Act, 2023'));
  });

  await t.test('calculates statutory 45-day resolution window for US CCPA/CPRA requests', () => {
    const fixedNow = new Date('2026-11-01T00:00:00.000Z');
    const record = createPrivacyRequestRecord(
      {
        jurisdiction: 'usa',
        requestType: 'do_not_sell_share',
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        stateOrRegion: 'California, USA',
        details: 'Confirming Do Not Sell or Share My Personal Information under CCPA/CPRA.',
        verifiedIdentity: true,
      },
      fixedNow
    );

    assert.match(record.ticketId, /^FS-USPRIV-2026-[A-Z0-9]{6}$/);
    assert.equal(record.resolutionDueBy, '2026-12-16T00:00:00.000Z'); // +45 days per CCPA
    assert.equal(JURISDICTION_SPECS.usa.resolutionDays, 45);
  });
});
