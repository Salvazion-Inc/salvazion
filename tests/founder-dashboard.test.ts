import assert from 'node:assert/strict';
import { test } from 'node:test';
import { destinationAfterAuth, safeNextPath } from '../lib/auth/paths';
import { isFounderEmail } from '../lib/founders/access';
import {
  normalizeCapsules,
  normalizeCatalogCounts,
  normalizeDex,
  normalizeFx,
  normalizeMarinas,
  normalizePartners,
  normalizeYachts,
} from '../lib/founders/normalize';

test('founder dashboard path is an exact allowlist', () => {
  assert.equal(safeNextPath('/dashboard'), '/dashboard');
  assert.equal(safeNextPath('/dashboard?from=profile'), '/dashboard?from=profile');
  assert.equal(safeNextPath('/dashboard/evil'), '/hub/dashboard');
  assert.equal(safeNextPath('/dashboard-evil'), '/hub/dashboard');
  assert.equal(safeNextPath('https://salvazion.org/dashboard'), '/hub/dashboard');
});

test('founders skip onboarding and land on the dashboard', () => {
  assert.equal(destinationAfterAuth('/dashboard', false), '/dashboard');
  assert.equal(destinationAfterAuth('/dashboard?from=profile', true), '/dashboard?from=profile');
  assert.equal(destinationAfterAuth('/dashboard/secret', false), '/hub/onboarding');
});

test('founder email is the operator plus FOUNDER_EMAILS', () => {
  const prevFounders = process.env.FOUNDER_EMAILS;
  const prevAdmins = process.env.BUSINESS_ADMIN_EMAILS;
  process.env.FOUNDER_EMAILS = 'ana@example.com';
  process.env.BUSINESS_ADMIN_EMAILS = '';
  try {
    assert.equal(isFounderEmail('info@salvazion.org'), true);
    assert.equal(isFounderEmail('Ana@Example.com'), true);
    assert.equal(isFounderEmail('stranger@example.com'), false);
    assert.equal(isFounderEmail(null), false);
    assert.equal(isFounderEmail(''), false);
  } finally {
    if (prevFounders === undefined) delete process.env.FOUNDER_EMAILS;
    else process.env.FOUNDER_EMAILS = prevFounders;
    if (prevAdmins === undefined) delete process.env.BUSINESS_ADMIN_EMAILS;
    else process.env.BUSINESS_ADMIN_EMAILS = prevAdmins;
  }
});

test('live payloads keep numbers and drop empty sources', () => {
  assert.equal(normalizeFx({ serie: [{ valor: 984.82 }] }), 984.82);
  assert.equal(normalizeFx({ serie: [] }), null);
  assert.equal(normalizeFx(null), null);

  assert.deepEqual(normalizeDex({ pairs: [] }), { paired: false, priceUsd: null });
  assert.deepEqual(normalizeDex({ pairs: [{ priceUsd: '0.012' }] }), {
    paired: true,
    priceUsd: 0.012,
  });

  const yachts = normalizeYachts({
    yachts: [
      {
        name: 'Galeon',
        priceFromUsd: 3440,
        lengthFt: 50,
        guests: 13,
        hoursMin: 4,
        marina: 'Miami Beach Marina',
        captain: { name: 'Captain Elena Ruiz' },
        traits: ['luxurious'],
      },
      { name: 'Draft', priceFromUsd: 0, guests: 4 },
      { name: 'SAVVY', priceFromUsd: 1585, guests: 0, hoursMin: 0, captain: 'Nora Blake' },
    ],
  });
  assert.deepEqual(
    yachts.map((yacht) => yacht.name),
    ['SAVVY', 'Galeon']
  );
  assert.equal(yachts[0].guests, 1);
  assert.equal(yachts[0].hours, 1);
  assert.equal(yachts[1].captain, 'Elena Ruiz');
  assert.equal(yachts[1].kind, 'luxurious');

  assert.deepEqual(normalizeMarinas({ places: [{ name: 'Brickell' }], mapHubs: 0 }), {
    checkoutMarinas: ['Brickell'],
    mapHubs: null,
  });
  assert.equal(normalizeMarinas({ places: [], mapHubs: 12 }).mapHubs, 12);

  const capsules = normalizeCapsules({
    capsules: [
      { name: 'Cápsula Laja', place: 'Cabrero', lands: ['Ríos'], price: 128000, guests: 2 },
      { name: 'Sin paisaje', place: 'Osorno', lands: [], price: 150000, guests: 2 },
      { name: 'Cero', price: 0 },
    ],
  });
  assert.equal(capsules.length, 2);
  assert.equal(capsules[1].land, 'Otros');

  assert.deepEqual(
    normalizeCatalogCounts({ destinations: 75, parks: 44, gastronomy: '44', activities: 31 }),
    { destinations: 75, parks: 44, gastronomy: 44, activities: 31 }
  );
  assert.equal(normalizePartners({ partners: [{ id: 'a' }] }), 1);
  assert.equal(normalizePartners(null), null);
  assert.equal(normalizePartners({}), null);
});
