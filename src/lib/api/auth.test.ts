import { NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	getCurrentUserMock: vi.fn(),
}));

vi.mock("@/lib/auth/current-user", () => ({
	getCurrentUser: mocks.getCurrentUserMock,
}));

import { requireApiAuth, unauthorizedResponse } from "@/lib/api/auth";

describe("Phase 2: API auth helper", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns the authenticated user when a session exists", async () => {
		mocks.getCurrentUserMock.mockResolvedValueOnce({
			id: "user-1",
			full_name: "Jane Doe",
			email: "jane@example.com",
		});

		const result = await requireApiAuth();

		expect(result).toEqual({
			id: "user-1",
			full_name: "Jane Doe",
			email: "jane@example.com",
		});
	});

	it("returns 401 when no session exists", async () => {
		mocks.getCurrentUserMock.mockResolvedValueOnce(null);

		const result = await requireApiAuth();

		expect(result).toBeInstanceOf(NextResponse);
		expect((result as NextResponse).status).toBe(401);
	});

	it("builds a structured unauthorized response", async () => {
		const response = unauthorizedResponse();
		const body = await response.json();

		expect(response.status).toBe(401);
		expect(body.error.code).toBe("UNAUTHORIZED");
	});
});
