#!/usr/bin/env node
/**
 * Create a login record for src/lib/auth/users.ts without storing the password.
 *   node scripts/add-user.mjs <username> [password]
 * If no password is given, a strong random one is generated and printed ONCE.
 * Only the salt + PBKDF2-derived verifier go in the code.
 */
import { webcrypto as crypto } from "node:crypto";

const ITERATIONS = 600_000;
const [, , username, given] = process.argv;
if (!username || !/^[a-z0-9._-]{3,32}$/.test(username)) {
  console.error("Usage: node scripts/add-user.mjs <username: a-z 0-9 . _ - (3–32)> [password]");
  process.exit(1);
}
// 80-bit random password from an unambiguous alphabet, grouped for readability: xxxx-xxxx-xxxx-xxxx
const ALPHA = "abcdefghjkmnpqrstuvwxyzACDEFGHJKLMNPQRTUVWXY346789";
const rand = (n) => Array.from(crypto.getRandomValues(new Uint32Array(n)), (x) => ALPHA[x % ALPHA.length]).join("");
const password = given ?? [rand(4), rand(4), rand(4), rand(4)].join("-");

const hex = (buf) => Buffer.from(buf).toString("hex");
const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: Buffer.from(salt, "hex"), iterations: ITERATIONS }, keyMaterial, 256);
const verifier = hex(await crypto.subtle.digest("SHA-256", bits));

console.log(`\nAdd this to USERS in src/lib/auth/users.ts:\n`);
console.log(`  { username: "${username}", salt: "${salt}", iterations: ${ITERATIONS}, verifier: "${verifier}" },\n`);
if (!given) console.log(`Password (shown once, not stored anywhere): ${password}\n`);
