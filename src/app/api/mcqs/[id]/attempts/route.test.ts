import { NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	requireApiAuthMock: vi.fn(),
	recordAttemptMock: vi.fn(),
}));

vi.mock("@/lib/api/auth", () => ({
	requireApiAuth: mocks.requireApiAuthMock,
}));

vi.mock("@/lib/services/mcq", () => ({
	recordAttempt: mocks.recordAttemptMock,
}));

import { POST } from "@/app/api/mcqs/[id]/attempts/route";

const authenticatedUser = {
	id: "user-1",
	full_name: "Jane Doe",
	email: "jane@example.com",
};

const routeContext = {
	params: Promise.resolve({ id: "mcq-1" }),
};

describe("Phase 2: /api/mcqs/[id]/attempts route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireApiAuthMock.mockResolvedValue(authenticatedUser);
	});

	it("returns 201 with attempt correctness", async () => {
		mocks.recordAttemptMock.mockResolvedValueOnce({
			id: "attempt-1",
			mcq_id: "mcq-1",
			user_id: "user-1",
			selected_choice_id: "choice-2",
			is_correct: true,
			attempted_at: "2026-09-04T11:00:00.000Z",
		});

		const response = await POST(
			new Request("http://localhost/api/mcqs/mcq-1/attempts", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ selected_choice_id: "choice-2" }),
			}),
			routeContext,
		);
		const body = await response.json();

		expect(response.status).toBe(201);
		expect(body.data.is_correct).toBe(true);
		expect(mocks.recordAttemptMock).toHaveBeenCalledWith("mcq-1", "user-1", {
			selected_choice_id: "choice-2",
		});
	});

	it("returns 400 when selected choice does not belong to the MCQ", async () => {
		mocks.recordAttemptMock.mockRejectedValueOnce(new Error("CHOICE_MCQ_MISMATCH"));

		const response = await POST(
			new Request("http://localhost/api/mcqs/mcq-1/attempts", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ selected_choice_id: "foreign-choice" }),
			}),
			routeContext,
		);
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body.error.code).toBe("CHOICE_MCQ_MISMATCH");
	});

	it("returns 401 when recording attempt without authentication", async () => {
		mocks.requireApiAuthMock.mockResolvedValueOnce(
			NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required." } }, { status: 401 }),
		);

		const response = await POST(
			new Request("http://localhost/api/mcqs/mcq-1/attempts", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ selected_choice_id: "choice-2" }),
			}),
			routeContext,
		);

		expect(response.status).toBe(401);
		expect(mocks.recordAttemptMock).not.toHaveBeenCalled();
	});
});
