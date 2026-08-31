"use server";

import { redirect } from "next/navigation";

import { getSessionId } from "@/lib/auth/current-user";
import { clearSessionCookie } from "@/lib/auth/session-cookie";
import { destroySession } from "@/lib/services/session";

export async function logoutAction(): Promise<void> {
	const sessionId = await getSessionId();

	if (sessionId) {
		await destroySession(sessionId);
	}

	await clearSessionCookie();
	redirect("/sign-in");
}
