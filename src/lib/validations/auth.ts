import { z } from "zod";

const specialCharacterPattern = /[^A-Za-z0-9]/;

export const signUpSchema = z
	.object({
		fullName: z.string().trim().min(1, "Full name is required."),
		email: z
			.string()
			.trim()
			.min(1, "Email address is required.")
			.pipe(z.email("Please enter a valid email address.")),
		password: z
			.string()
			.min(1, "Password is required.")
			.min(8, "Password must be at least 8 characters.")
			.regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
			.regex(/[a-z]/, "Password must contain at least one lowercase letter.")
			.regex(/[0-9]/, "Password must contain at least one number.")
			.regex(specialCharacterPattern, "Password must contain at least one special character."),
		confirmPassword: z.string().min(1, "Please confirm your password."),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match.",
		path: ["confirmPassword"],
	});

export const signInSchema = z.object({
	email: z
		.string()
		.trim()
		.min(1, "Email address is required.")
		.pipe(z.email("Please enter a valid email address.")),
	password: z.string().min(1, "Password is required."),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;

export function toFieldErrors(error: z.ZodError): Record<string, string[]> {
	const fieldErrors: Record<string, string[]> = {};

	for (const issue of error.issues) {
		const field = issue.path[0];

		if (typeof field !== "string") {
			continue;
		}

		if (!fieldErrors[field]) {
			fieldErrors[field] = [];
		}

		fieldErrors[field].push(issue.message);
	}

	return fieldErrors;
}
