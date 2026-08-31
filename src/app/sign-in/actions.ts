"use server";

import { redirect } from "next/navigation";

import { setSessionCookie } from "@/lib/auth/session-cookie";
import type { AuthFormState } from "@/lib/auth/types";
import { authenticateUser } from "@/lib/services/auth";
import { createSession } from "@/lib/services/session";
import { signInSchema, toFieldErrors } from "@/lib/validations/auth";

export async function signInAction(_previousState: AuthFormState, formData: FormData): Promise<AuthFormState> {
	const parsed = signInSchema.safeParse({
		email: formData.get("email"),
		password: formData.get("password"),
	});

	if (!parsed.success) {
		return { fieldErrors: toFieldErrors(parsed.error) };
	}

	try {
		const user = await authenticateUser(parsed.data.email, parsed.data.password);

		if (!user) {
			return { formError: "Invalid email or password." };
		}

		const sessionId = await createSession(user.id);
		await setSessionCookie(sessionId);
	} catch {
		return { formError: "Something went wrong. Please try again." };
	}

	redirect("/dashboard");
}
