import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "@/lib/services/password";

describe("Phase 1: password hashing", () => {
	it("hashes passwords in salt:hash format", async () => {
		const hash = await hashPassword("Password1!");

		expect(hash).toMatch(/^[a-f0-9]+:[a-f0-9]+$/);
	});

	it("verifies a correct password", async () => {
		const hash = await hashPassword("Password1!");

		expect(await verifyPassword("Password1!", hash)).toBe(true);
	});

	it("rejects an incorrect password", async () => {
		const hash = await hashPassword("Password1!");

		expect(await verifyPassword("WrongPass1!", hash)).toBe(false);
	});

	it("rejects malformed stored hashes", async () => {
		expect(await verifyPassword("Password1!", "not-a-valid-hash")).toBe(false);
	});
});
