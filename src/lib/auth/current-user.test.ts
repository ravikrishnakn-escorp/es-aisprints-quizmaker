import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	cookiesGetMock: vi.fn(),
	cookiesSetMock: vi.fn(),
	cookiesDeleteMock: vi.fn(),
	validateSessionMock: vi.fn(),
	redirectMock: vi.fn((url: string) => {
		throw new Error(`NEXT_REDIRECT:${url}`);
	}),
}));

vi.mock("next/headers", () => ({
	cookies: vi.fn(async () => ({
		get: mocks.cookiesGetMock,
		set: mocks.cookiesSetMock,
		delete: mocks.cookiesDeleteMock,
	})),
}));

vi.mock("@/lib/services/session", () => ({
	validateSession: mocks.validateSessionMock,
}));

vi.mock("next/navigation", () => ({
	redirect: mocks.redirectMock,
}));

import { getCurrentUser, redirectIfAuthenticated, requireAuth } from "@/lib/auth/current-user";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { clearSessionCookie, setSessionCookie } from "@/lib/auth/session-cookie";

describe("Phase 3: route protection helpers", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns null when no session cookie exists", async () => {
		mocks.cookiesGetMock.mockReturnValue(undefined);

		expect(await getCurrentUser()).toBeNull();
	});

	it("returns the current user for a valid session", async () => {
		mocks.cookiesGetMock.mockReturnValue({ value: "session-1" });
		mocks.validateSessionMock.mockResolvedValueOnce({
			id: "user-1",
			full_name: "Jane Doe",
			email: "jane@example.com",
		});

		expect(await getCurrentUser()).toEqual({
			id: "user-1",
			full_name: "Jane Doe",
			email: "jane@example.com",
		});
	});

	it("redirects unauthenticated users from protected routes", async () => {
		mocks.cookiesGetMock.mockReturnValue(undefined);

		await expect(requireAuth()).rejects.toThrow("NEXT_REDIRECT:/sign-in");
	});

	it("redirects authenticated users away from auth pages", async () => {
		mocks.cookiesGetMock.mockReturnValue({ value: "session-1" });
		mocks.validateSessionMock.mockResolvedValueOnce({
			id: "user-1",
			full_name: "Jane Doe",
			email: "jane@example.com",
		});

		await expect(redirectIfAuthenticated()).rejects.toThrow("NEXT_REDIRECT:/dashboard");
	});
});

describe("Phase 1: session cookie settings", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("sets a secure, HTTP-only session cookie", async () => {
		await setSessionCookie("session-1");

		expect(mocks.cookiesSetMock).toHaveBeenCalledWith(
			SESSION_COOKIE_NAME,
			"session-1",
			expect.objectContaining({
				httpOnly: true,
				sameSite: "lax",
				path: "/",
			}),
		);
	});

	it("clears the session cookie on logout", async () => {
		await clearSessionCookie();

		expect(mocks.cookiesDeleteMock).toHaveBeenCalledWith(SESSION_COOKIE_NAME);
	});
});
