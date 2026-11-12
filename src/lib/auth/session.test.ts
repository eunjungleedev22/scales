import { describe, expect, it } from "vitest";
import { lockedFor, login, recordFailure, verifySession, clearFailures } from "./session";
import { USERS } from "./users";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

describe("auth", () => {
  it("stores no plaintext passwords, only salted verifiers", () => {
    for (const u of USERS) {
      expect(u.salt).toMatch(/^[0-9a-f]{32}$/);
      expect(u.verifier).toMatch(/^[0-9a-f]{64}$/);
      expect(u.iterations).toBeGreaterThanOrEqual(600_000);
    }
    expect(new Set(USERS.map((u) => u.salt)).size).toBe(USERS.length); // unique salts
    expect(USERS.map((u) => u.username)).toEqual(expect.arrayContaining(["cat", "bruno"]));
  });

  it("accepts the right password and rejects wrong ones / unknown users", async () => {
    const ok = await login("cat", "kitten-paws-2209");
    expect(ok?.user).toBe("cat");
    expect(await login("CAT ", "kitten-paws-2209")).not.toBeNull(); // username is case/space-insensitive
    expect(await login("cat", "kitten-paws-2208")).toBeNull();
    expect(await login("bruno", "kitten-paws-2209")).toBeNull(); // other users' passwords don't work
    expect(await login("mallory", "anything")).toBeNull();
  }, 20_000);

  it("validates sessions and rejects tampered or forged cookies", async () => {
    const ok = await login("cat", "kitten-paws-2209");
    expect(await verifySession(ok!.token)).toBe("cat");
    const key = ok!.token.split(".")[1];
    expect(await verifySession(`bruno.${key}`)).toBeNull(); // can't reuse a key for another user
    expect(await verifySession(`cat.${key.slice(0, -1)}0`)).toBeNull();
    expect(await verifySession(`cat.${USERS[0].verifier}`)).toBeNull(); // the public verifier isn't a valid session
    expect(await verifySession("cat")).toBeNull();
    expect(await verifySession(undefined)).toBeNull();
  }, 20_000);

  it("locks an account after 5 failed attempts", () => {
    const k = "u:test-lock";
    clearFailures(k);
    for (let i = 0; i < 4; i++) recordFailure(k);
    expect(lockedFor(k)).toBe(0);
    recordFailure(k);
    expect(lockedFor(k)).toBeGreaterThan(14 * 60_000);
  });

  it("never commits the generated password for other users to the source tree", () => {
    const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
    const src = walk("src").map((f) => readFileSync(f, "utf8")).join("\n");
    // Any password-shaped string in the code must NOT be Bruno's real password
    const candidates = [...new Set(src.match(/\b[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}\b/g) ?? [])];
    return Promise.all(candidates.map(async (c) => expect(await login("bruno", c)).toBeNull()));
  }, 60_000);
});
