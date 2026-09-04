import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	getSessionIdMock: vi.fn(),
	destroySessionMock: vi.fn(),
	clearSessionCookieMock: vi.fn(),
	redirectMock: vi.fn((url: string) => {
		throw new Error(`NEXT_REDIRECT:${url}`);
	}),
}));

vi.mock("@/lib/auth/current-user", () => ({
	getSessionId: mocks.getSessionIdMock,
}));

vi.mock("@/lib/services/session", () => ({
	destroySession: mocks.destroySessionMock,
}));

vi.mock("@/lib/auth/session-cookie", () => ({
	clearSessionCookie: mocks.clearSessionCookieMock,
}));

vi.mock("next/navigation", () => ({
	redirect: mocks.redirectMock,
}));

import { logoutAction } from "@/app/dashboard/actions";

describe("Phase 3: logout action", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("destroys the session and clears the cookie", async () => {
		mocks.getSessionIdMock.mockResolvedValueOnce("session-1");

		await expect(logoutAction()).rejects.toThrow("NEXT_REDIRECT:/sign-in");

		expect(mocks.destroySessionMock).toHaveBeenCalledWith("session-1");
		expect(mocks.clearSessionCookieMock).toHaveBeenCalled();
	});

	it("still clears the cookie when no session exists", async () => {
		mocks.getSessionIdMock.mockResolvedValueOnce(undefined);

		await expect(logoutAction()).rejects.toThrow("NEXT_REDIRECT:/sign-in");

		expect(mocks.destroySessionMock).not.toHaveBeenCalled();
		expect(mocks.clearSessionCookieMock).toHaveBeenCalled();
	});
});
