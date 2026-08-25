import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { validateSession } from "@/lib/services/session";
import type { PublicUser } from "@/lib/services/user";

export async function getSessionId(): Promise<string | undefined> {
	const cookieStore = await cookies();
	return cookieStore.get(SESSION_COOKIE_NAME)?.value;
}

export async function getCurrentUser(): Promise<PublicUser | null> {
	const sessionId = await getSessionId();

	if (!sessionId) {
		return null;
	}

	return validateSession(sessionId);
}

export async function requireAuth(): Promise<PublicUser> {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/sign-in");
	}

	return user;
}

export async function redirectIfAuthenticated(): Promise<void> {
	const user = await getCurrentUser();

	if (user) {
		redirect("/dashboard");
	}
}
