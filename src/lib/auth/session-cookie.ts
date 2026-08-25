import { cookies } from "next/headers";

import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/constants";

export async function setSessionCookie(sessionId: string): Promise<void> {
	const cookieStore = await cookies();

	cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		path: "/",
		maxAge: SESSION_MAX_AGE_SECONDS,
	});
}

export async function clearSessionCookie(): Promise<void> {
	const cookieStore = await cookies();

	cookieStore.delete(SESSION_COOKIE_NAME);
}
