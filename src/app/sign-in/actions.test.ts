import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	authenticateUserMock: vi.fn(),
	createSessionMock: vi.fn(),
	setSessionCookieMock: vi.fn(),
	redirectMock: vi.fn((url: string) => {
		throw new Error(`NEXT_REDIRECT:${url}`);
	}),
}));

vi.mock("@/lib/services/auth", () => ({
	authenticateUser: mocks.authenticateUserMock,
}));

vi.mock("@/lib/services/session", () => ({
	createSession: mocks.createSessionMock,
}));

vi.mock("@/lib/auth/session-cookie", () => ({
	setSessionCookie: mocks.setSessionCookieMock,
}));

vi.mock("next/navigation", () => ({
	redirect: mocks.redirectMock,
}));

import { signInAction } from "@/app/sign-in/actions";
import { initialAuthFormState } from "@/lib/auth/types";

function createSignInForm(overrides: Record<string, string> = {}) {
	const formData = new FormData();
	formData.set("email", overrides.email ?? "jane@example.com");
	formData.set("password", overrides.password ?? "Password1!");
	return formData;
}

describe("Phase 2: sign-in action", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns field errors for invalid input", async () => {
		const result = await signInAction(initialAuthFormState, createSignInForm({ email: "" }));

		expect(result.fieldErrors?.email).toContain("Email address is required.");
		expect(mocks.authenticateUserMock).not.toHaveBeenCalled();
	});

	it("returns generic invalid credentials message", async () => {
		mocks.authenticateUserMock.mockResolvedValueOnce(null);

		const result = await signInAction(initialAuthFormState, createSignInForm());

		expect(result.formError).toBe("Invalid email or password.");
	});

	it("returns generic error on unexpected failures", async () => {
		mocks.authenticateUserMock.mockRejectedValueOnce(new Error("DB failure"));

		const result = await signInAction(initialAuthFormState, createSignInForm());

		expect(result.formError).toBe("Something went wrong. Please try again.");
	});

	it("creates a session and redirects to dashboard on success", async () => {
		mocks.authenticateUserMock.mockResolvedValueOnce({
			id: "user-1",
			full_name: "Jane Doe",
			email: "jane@example.com",
		});
		mocks.createSessionMock.mockResolvedValueOnce("session-1");

		await expect(signInAction(initialAuthFormState, createSignInForm())).rejects.toThrow("NEXT_REDIRECT:/dashboard");

		expect(mocks.createSessionMock).toHaveBeenCalledWith("user-1");
		expect(mocks.setSessionCookieMock).toHaveBeenCalledWith("session-1");
	});
});
