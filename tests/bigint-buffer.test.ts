import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";

const require = createRequire(__filename);
const { toBigIntBE, toBigIntLE, toBufferBE, toBufferLE } = require("bigint-buffer") as {
  toBigIntLE: (buf: Uint8Array) => bigint;
  toBigIntBE: (buf: Uint8Array) => bigint;
  toBufferLE: (num: bigint, width: number) => Buffer;
  toBufferBE: (num: bigint, width: number) => Buffer;
};

test("bigint-buffer loads without the native-binding warning", () => {
  const warnings: unknown[][] = [];
  const original = console.warn;
  console.warn = (...args: unknown[]) => {
    warnings.push(args);
  };
  try {
    delete require.cache[require.resolve("bigint-buffer")];
    require("bigint-buffer");
  } finally {
    console.warn = original;
  }
  const text = warnings.map((args) => args.join(" ")).join("\n");
  assert.equal(text.includes("Failed to load bindings"), false);
  assert.equal(text.includes("pure JS"), false);
});

test("little-endian and big-endian round-trip at Solana widths", () => {
  for (const width of [8, 16, 24, 32]) {
    const value = (1n << BigInt(width * 8 - 1)) + 0xffn;
    assert.equal(toBigIntLE(toBufferLE(value, width)), value);
    assert.equal(toBigIntBE(toBufferBE(value, width)), value);
  }
  assert.deepEqual([...toBufferLE(1n, 8)], [1, 0, 0, 0, 0, 0, 0, 0]);
  assert.deepEqual([...toBufferBE(1n, 8)], [0, 0, 0, 0, 0, 0, 0, 1]);
  assert.equal(toBigIntLE(Buffer.alloc(0)), 0n);
  assert.equal(toBigIntBE(Buffer.alloc(0)), 0n);
});

test("oversized input is rejected", () => {
  assert.throws(() => toBigIntLE(Buffer.alloc(65)), RangeError);
  assert.throws(() => toBufferBE(1n, 65), RangeError);
  assert.throws(() => toBufferLE(-1n, 8), TypeError);
});
