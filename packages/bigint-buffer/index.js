"use strict";

const { Buffer } = require("buffer");

// Solana layouts that call this are 8, 16, 24, or 32 bytes. The cap stops a
// huge buffer from allocating without bound (CVE-2025-3194 on the native addon).
const MAX_BYTES = 64;

function asBytes(buf) {
  if (!Buffer.isBuffer(buf) && !(buf instanceof Uint8Array)) {
    throw new TypeError("expected a Buffer");
  }
  if (buf.length > MAX_BYTES) {
    throw new RangeError("buffer is longer than " + MAX_BYTES + " bytes");
  }
  return Buffer.from(buf);
}

function asWidth(width) {
  if (!Number.isInteger(width) || width < 0 || width > MAX_BYTES) {
    throw new RangeError("width must be an integer from 0 to " + MAX_BYTES);
  }
  return width;
}

function asNonNegative(num) {
  if (typeof num !== "bigint" || num < 0n) {
    throw new TypeError("expected a non-negative bigint");
  }
  return num;
}

function toBigIntLE(buf) {
  const bytes = asBytes(buf);
  let value = 0n;
  for (let i = bytes.length - 1; i >= 0; i--) {
    value = (value << 8n) + BigInt(bytes[i]);
  }
  return value;
}

function toBigIntBE(buf) {
  const bytes = asBytes(buf);
  let value = 0n;
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8n) + BigInt(bytes[i]);
  }
  return value;
}

function toBufferLE(num, width) {
  const value = asNonNegative(num);
  const size = asWidth(width);
  const out = Buffer.alloc(size);
  let rest = value;
  for (let i = 0; i < size; i++) {
    out[i] = Number(rest & 0xffn);
    rest >>= 8n;
  }
  if (rest !== 0n) {
    throw new RangeError("bigint does not fit in " + size + " bytes");
  }
  return out;
}

function toBufferBE(num, width) {
  const out = toBufferLE(num, width);
  out.reverse();
  return out;
}

module.exports = {
  toBigIntLE,
  toBigIntBE,
  toBufferLE,
  toBufferBE,
};
