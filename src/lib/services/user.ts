import { getDb } from "@/lib/db";
import { hashPassword } from "@/lib/services/password";

export type UserRecord = {
	id: string;
	full_name: string;
	email: string;
	password_hash: string;
	created_at: string;
	updated_at: string;
};

export type PublicUser = {
	id: string;
	full_name: string;
	email: string;
};

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
	const db = await getDb();
	const normalizedEmail = email.trim().toLowerCase();
	const { results } = await db
		.prepare("SELECT id, full_name, email, password_hash, created_at, updated_at FROM users WHERE email = ?1")
		.bind(normalizedEmail)
		.all<UserRecord>();

	return results[0] ?? null;
}

export async function createUser(fullName: string, email: string, password: string): Promise<PublicUser> {
	const db = await getDb();
	const normalizedEmail = email.trim().toLowerCase();
	const trimmedName = fullName.trim();

	const existingUser = await findUserByEmail(normalizedEmail);

	if (existingUser) {
		throw new Error("EMAIL_ALREADY_EXISTS");
	}

	const passwordHash = await hashPassword(password);

	await db
		.prepare("INSERT INTO users (full_name, email, password_hash) VALUES (?1, ?2, ?3)")
		.bind(trimmedName, normalizedEmail, passwordHash)
		.run();

	const user = await findUserByEmail(normalizedEmail);

	if (!user) {
		throw new Error("Failed to create user.");
	}

	return toPublicUser(user);
}

export function toPublicUser(user: UserRecord): PublicUser {
	return {
		id: user.id,
		full_name: user.full_name,
		email: user.email,
	};
}
