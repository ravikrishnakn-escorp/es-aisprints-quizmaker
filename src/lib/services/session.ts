import { getDb } from "@/lib/db";
import type { PublicUser } from "@/lib/services/user";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

type SessionUserRow = {
	id: string;
	full_name: string;
	email: string;
	expires_at: string;
};

function getExpiresAt(): string {
	return new Date(Date.now() + SESSION_DURATION_MS).toISOString();
}

function isExpired(expiresAt: string): boolean {
	return new Date(expiresAt).getTime() <= Date.now();
}

export async function createSession(userId: string): Promise<string> {
	const db = await getDb();
	const sessionId = crypto.randomUUID();
	const expiresAt = getExpiresAt();

	await db
		.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?1, ?2, ?3)")
		.bind(sessionId, userId, expiresAt)
		.run();

	return sessionId;
}

export async function validateSession(sessionId: string): Promise<PublicUser | null> {
	if (!sessionId) {
		return null;
	}

	const db = await getDb();
	const { results } = await db
		.prepare(
			`SELECT u.id, u.full_name, u.email, s.expires_at
       FROM sessions s
       INNER JOIN users u ON u.id = s.user_id
       WHERE s.id = ?1`,
		)
		.bind(sessionId)
		.all<SessionUserRow>();

	const session = results[0];

	if (!session) {
		return null;
	}

	if (isExpired(session.expires_at)) {
		await destroySession(sessionId);
		return null;
	}

	return {
		id: session.id,
		full_name: session.full_name,
		email: session.email,
	};
}

export async function destroySession(sessionId: string): Promise<void> {
	if (!sessionId) {
		return;
	}

	const db = await getDb();

	await db.prepare("DELETE FROM sessions WHERE id = ?1").bind(sessionId).run();
}
