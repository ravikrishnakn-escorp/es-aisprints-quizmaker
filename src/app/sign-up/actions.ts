"use server";

import { redirect } from "next/navigation";

import type { AuthFormState } from "@/lib/auth/types";
import { createUser } from "@/lib/services/user";
import { signUpSchema, toFieldErrors } from "@/lib/validations/auth";

export async function signUpAction(_previousState: AuthFormState, formData: FormData): Promise<AuthFormState> {
	const parsed = signUpSchema.safeParse({
		fullName: formData.get("fullName"),
		email: formData.get("email"),
		password: formData.get("password"),
		confirmPassword: formData.get("confirmPassword"),
	});

	if (!parsed.success) {
		return { fieldErrors: toFieldErrors(parsed.error) };
	}

	try {
		await createUser(parsed.data.fullName, parsed.data.email, parsed.data.password);
	} catch (error) {
		if (error instanceof Error && error.message === "EMAIL_ALREADY_EXISTS") {
			return {
				fieldErrors: {
					email: ["An account with this email already exists. Please sign in."],
				},
			};
		}

		return { formError: "Something went wrong. Please try again." };
	}

	redirect("/sign-in?success=registered");
}
