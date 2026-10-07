import { test } from 'node:test';
import assert from 'node:assert/strict';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import {
  HOLDER_CHALLENGE_TTL_MS,
  buildHolderMessage,
  decodeSignature,
  isValidSolanaAddress,
  newNonce,
  signChallengeToken,
  sumMintBalance,
  verifyChallengeToken,
  verifyWalletSignature,
  type HolderChallengePayload,
} from '../lib/solana/holder-proof';
import { hasPositiveBalance } from '../lib/solana/holder-balance';

const SECRET = 'test-secret';
const MINT = '2XALhxGKCr2zCADkMANBq3b6rV7Zv5QF6RVZokgEAfUM';

function setup(now = Date.now()) {
  const kp = nacl.sign.keyPair();
  const wallet = bs58.encode(kp.publicKey);
  const payload: HolderChallengePayload = {
    v: 1,
    domain: 'salvazion.org',
    userId: '00000000-0000-0000-0000-000000000001',
    wallet,
    nonce: newNonce(),
    issuedAt: new Date(now).toISOString(),
    lang: 'es',
  };
  const message = buildHolderMessage(payload);
  const sig = nacl.sign.detached(new TextEncoder().encode(message), kp.secretKey);
  return { kp, wallet, payload, message, sig };
}

test('valid signature verifies (base58 and base64)', () => {
  const { wallet, message, sig } = setup();
  const b58 = decodeSignature(bs58.encode(sig));
  const b64 = decodeSignature(Buffer.from(sig).toString('base64'));
  assert.ok(b58 && b64);
  assert.equal(verifyWalletSignature(message, b58, wallet), true);
  assert.equal(verifyWalletSignature(message, b64, wallet), true);
});

test('tampered message, other wallet or garbage signature is rejected', () => {
  const { wallet, message, sig } = setup();
  assert.equal(verifyWalletSignature(message + 'x', sig, wallet), false);
  const other = bs58.encode(nacl.sign.keyPair().publicKey);
  assert.equal(verifyWalletSignature(message, sig, other), false);
  assert.equal(verifyWalletSignature(message, new Uint8Array(64), wallet), false);
  assert.equal(decodeSignature('not-a-signature'), null);
  assert.equal(decodeSignature(''), null);
  assert.equal(decodeSignature(123), null);
});

test('message binds domain, account, wallet and nonce', () => {
  const { payload, message } = setup();
  for (const v of [payload.domain, payload.userId, payload.wallet, payload.nonce, payload.issuedAt]) {
    assert.ok(message.includes(v));
  }
  assert.match(message, /No es una transacción/);
});

test('challenge token round-trips and rejects tampering', () => {
  const { payload } = setup();
  const token = signChallengeToken(payload, SECRET);
  const ok = verifyChallengeToken(token, SECRET);
  assert.equal(ok.ok, true);
  if (ok.ok) assert.deepEqual(ok.payload, payload);

  assert.deepEqual(verifyChallengeToken(token, 'other-secret'), { ok: false, error: 'bad_token' });
  const [body, mac] = token.split('.');
  const forged = Buffer.from(
    JSON.stringify({ ...payload, userId: '00000000-0000-0000-0000-000000000002' })
  ).toString('base64url');
  assert.deepEqual(verifyChallengeToken(`${forged}.${mac}`, SECRET), { ok: false, error: 'bad_token' });
  assert.deepEqual(verifyChallengeToken(`${body}`, SECRET), { ok: false, error: 'bad_token' });
  assert.deepEqual(verifyChallengeToken(null, SECRET), { ok: false, error: 'bad_token' });
});

test('challenge token expires after TTL and rejects future issuedAt', () => {
  const now = Date.now();
  const old = setup(now - HOLDER_CHALLENGE_TTL_MS - 1000).payload;
  assert.deepEqual(verifyChallengeToken(signChallengeToken(old, SECRET), SECRET, now), {
    ok: false,
    error: 'expired',
  });
  const future = setup(now + 5 * 60 * 1000).payload;
  assert.deepEqual(verifyChallengeToken(signChallengeToken(future, SECRET), SECRET, now), {
    ok: false,
    error: 'bad_token',
  });
});

test('address validation', () => {
  assert.equal(isValidSolanaAddress(MINT), true);
  assert.equal(isValidSolanaAddress('WLHv2UAZm6z4KyaaELi5pjdbJh6RESMva1Rnn8pJVVh'), true);
  assert.equal(isValidSolanaAddress('0x1234'), false);
  assert.equal(isValidSolanaAddress(''), false);
  assert.equal(isValidSolanaAddress(null), false);
});

test('sumMintBalance only counts the $SALVAZION mint (6 decimals)', () => {
  const acc = (mint: string, amount: string) => ({
    account: { data: { parsed: { info: { mint, tokenAmount: { amount, decimals: 6 } } } } },
  });
  const r = sumMintBalance(
    [acc(MINT, '1500000'), acc(MINT, '250000'), acc('So11111111111111111111111111111111111111112', '999999999')],
    MINT,
    6
  );
  assert.equal(r.raw, '1750000');
  assert.equal(r.ui, 1.75);
  assert.equal(hasPositiveBalance(r), true);

  const zero = sumMintBalance([acc(MINT, '0')], MINT, 6);
  assert.equal(zero.raw, '0');
  assert.equal(hasPositiveBalance(zero), false);
  assert.equal(hasPositiveBalance(sumMintBalance([], MINT, 6)), false);

  const dust = sumMintBalance([acc(MINT, '1')], MINT, 6);
  assert.equal(hasPositiveBalance(dust), true);
});
