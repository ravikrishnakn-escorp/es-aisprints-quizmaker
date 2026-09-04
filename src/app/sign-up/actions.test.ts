import { beforeEach, describe, expect, it, vi } from "vitest";

const { createUserMock, redirectMock } = vi.hoisted(() => ({
	createUserMock: vi.fn(),
	redirectMock: vi.fn((url: string) => {
		throw new Error(`NEXT_REDIRECT:${url}`);
	}),
}));

vi.mock("@/lib/services/user", () => ({
	createUser: createUserMock,
}));

vi.mock("next/navigation", () => ({
	redirect: redirectMock,
}));

import { signUpAction } from "@/app/sign-up/actions";
import { initialAuthFormState } from "@/lib/auth/types";

function createSignUpForm(overrides: Record<string, string> = {}) {
	const formData = new FormData();
	formData.set("fullName", overrides.fullName ?? "Jane Doe");
	formData.set("email", overrides.email ?? "jane@example.com");
	formData.set("password", overrides.password ?? "Password1!");
	formData.set("confirmPassword", overrides.confirmPassword ?? "Password1!");
	return formData;
}

describe("Phase 2: sign-up action", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns field errors for invalid input", async () => {
		const result = await signUpAction(initialAuthFormState, createSignUpForm({ email: "bad-email" }));

		expect(result.fieldErrors?.email).toContain("Please enter a valid email address.");
		expect(createUserMock).not.toHaveBeenCalled();
	});

	it("returns email conflict error when user already exists", async () => {
		createUserMock.mockRejectedValueOnce(new Error("EMAIL_ALREADY_EXISTS"));

		const result = await signUpAction(initialAuthFormState, createSignUpForm());

		expect(result.fieldErrors?.email).toContain("An account with this email already exists. Please sign in.");
	});

	it("returns generic error on unexpected failures", async () => {
		createUserMock.mockRejectedValueOnce(new Error("DB failure"));

		const result = await signUpAction(initialAuthFormState, createSignUpForm());

		expect(result.formError).toBe("Something went wrong. Please try again.");
	});

	it("redirects to sign-in after successful registration", async () => {
		createUserMock.mockResolvedValueOnce({
			id: "user-1",
			full_name: "Jane Doe",
			email: "jane@example.com",
		});

		await expect(signUpAction(initialAuthFormState, createSignUpForm())).rejects.toThrow(
			"NEXT_REDIRECT:/sign-in?success=registered",
		);
	});
});
