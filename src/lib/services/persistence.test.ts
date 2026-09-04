import { beforeEach, describe, expect, it, vi } from "vitest";

const d1State = vi.hoisted(() => {
	const users: Array<{
		id: string;
		full_name: string;
		email: string;
		password_hash: string;
		created_at: string;
		updated_at: string;
	}> = [];
	const sessions: Array<{
		id: string;
		user_id: string;
		expires_at: string;
		created_at: string;
	}> = [];

	const db = {
		prepare(sql: string) {
			return {
				bind(...bindings: unknown[]) {
					return {
						async all<T>() {
							if (sql.includes("FROM users WHERE email")) {
								const email = String(bindings[0]).toLowerCase();
								return { results: users.filter((user) => user.email === email) as T[] };
							}

							if (sql.includes("FROM sessions s") && sql.includes("INNER JOIN users")) {
								const sessionId = String(bindings[0]);
								const session = sessions.find((row) => row.id === sessionId);

								if (!session) {
									return { results: [] as T[] };
								}

								const user = users.find((row) => row.id === session.user_id);

								if (!user) {
									return { results: [] as T[] };
								}

								return {
									results: [
										{
											id: user.id,
											full_name: user.full_name,
											email: user.email,
											expires_at: session.expires_at,
										},
									] as T[],
								};
							}

							return { results: [] as T[] };
						},
						async run() {
							if (sql.includes("INSERT INTO users")) {
								const [fullName, email, passwordHash] = bindings as [string, string, string];
								users.push({
									id: crypto.randomUUID().replace(/-/g, ""),
									full_name: fullName,
									email: email.toLowerCase(),
									password_hash: passwordHash,
									created_at: new Date().toISOString(),
									updated_at: new Date().toISOString(),
								});
							}

							if (sql.includes("INSERT INTO sessions")) {
								const [id, userId, expiresAt] = bindings as [string, string, string];
								sessions.push({
									id,
									user_id: userId,
									expires_at: expiresAt,
									created_at: new Date().toISOString(),
								});
							}

							if (sql.includes("DELETE FROM sessions")) {
								const sessionId = String(bindings[0]);
								const index = sessions.findIndex((row) => row.id === sessionId);
								if (index >= 0) {
									sessions.splice(index, 1);
								}
							}

							return { success: true };
						},
					};
				},
			};
		},
	};

	return { users, sessions, db };
});

vi.mock("@/lib/db", () => ({
	getDb: vi.fn(async () => d1State.db),
}));

import { authenticateUser } from "@/lib/services/auth";
import { verifyPassword } from "@/lib/services/password";
import { createSession, destroySession, validateSession } from "@/lib/services/session";
import { createUser, findUserByEmail } from "@/lib/services/user";

describe("Phase 1: user persistence", () => {
	beforeEach(() => {
		d1State.users.length = 0;
		d1State.sessions.length = 0;
		vi.clearAllMocks();
	});

	it("creates a user with a normalized email", async () => {
		const user = await createUser("Jane Doe", "Jane@Example.com", "Password1!");

		expect(user.full_name).toBe("Jane Doe");
		expect(user.email).toBe("jane@example.com");
	});

	it("stores verifiable password hashes", async () => {
		await createUser("Jane Doe", "jane@example.com", "Password1!");

		const stored = d1State.users[0];
		expect(stored.password_hash).not.toBe("Password1!");
		expect(await verifyPassword("Password1!", stored.password_hash)).toBe(true);
	});

	it("throws when email already exists", async () => {
		await createUser("Jane Doe", "jane@example.com", "Password1!");

		await expect(createUser("Other User", "jane@example.com", "Password2!")).rejects.toThrow("EMAIL_ALREADY_EXISTS");
	});

	it("finds users by email case-insensitively", async () => {
		await createUser("Jane Doe", "jane@example.com", "Password1!");

		const user = await findUserByEmail("JANE@EXAMPLE.COM");
		expect(user?.email).toBe("jane@example.com");
	});

	it("returns null when user does not exist", async () => {
		expect(await findUserByEmail("missing@example.com")).toBeNull();
	});
});

describe("Phase 1: session management", () => {
	beforeEach(() => {
		d1State.users.length = 0;
		d1State.sessions.length = 0;
		vi.clearAllMocks();
	});

	it("creates a session for a user", async () => {
		const user = await createUser("Jane Doe", "jane@example.com", "Password1!");
		const sessionId = await createSession(user.id);

		expect(sessionId).toBeTruthy();
		expect(d1State.sessions).toHaveLength(1);
	});

	it("validates an active session and returns the user", async () => {
		const user = await createUser("Jane Doe", "jane@example.com", "Password1!");
		const sessionId = await createSession(user.id);

		expect(await validateSession(sessionId)).toEqual({
			id: user.id,
			full_name: "Jane Doe",
			email: "jane@example.com",
		});
	});

	it("returns null for unknown sessions", async () => {
		expect(await validateSession("missing-session")).toBeNull();
	});

	it("returns null for expired sessions and removes them", async () => {
		const user = await createUser("Jane Doe", "jane@example.com", "Password1!");
		const sessionId = await createSession(user.id);
		d1State.sessions[0].expires_at = new Date(Date.now() - 1_000).toISOString();

		expect(await validateSession(sessionId)).toBeNull();
		expect(d1State.sessions).toHaveLength(0);
	});

	it("destroys a session on logout", async () => {
		const user = await createUser("Jane Doe", "jane@example.com", "Password1!");
		const sessionId = await createSession(user.id);

		await destroySession(sessionId);

		expect(d1State.sessions).toHaveLength(0);
	});
});

describe("Phase 1: credential authentication", () => {
	beforeEach(() => {
		d1State.users.length = 0;
		d1State.sessions.length = 0;
		vi.clearAllMocks();
	});

	it("returns the public user for valid credentials", async () => {
		await createUser("Jane Doe", "jane@example.com", "Password1!");

		const user = await authenticateUser("jane@example.com", "Password1!");

		expect(user).toEqual({
			id: expect.any(String),
			full_name: "Jane Doe",
			email: "jane@example.com",
		});
	});

	it("returns null for unknown email", async () => {
		expect(await authenticateUser("missing@example.com", "Password1!")).toBeNull();
	});

	it("returns null for invalid password", async () => {
		await createUser("Jane Doe", "jane@example.com", "Password1!");

		expect(await authenticateUser("jane@example.com", "WrongPass1!")).toBeNull();
	});
});
