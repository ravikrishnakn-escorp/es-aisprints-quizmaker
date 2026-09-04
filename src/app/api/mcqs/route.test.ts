import { NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	requireApiAuthMock: vi.fn(),
	listMcqsMock: vi.fn(),
	createMcqMock: vi.fn(),
}));

vi.mock("@/lib/api/auth", () => ({
	requireApiAuth: mocks.requireApiAuthMock,
	unauthorizedResponse: () =>
		NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required." } }, { status: 401 }),
}));

vi.mock("@/lib/services/mcq", () => ({
	listMcqs: mocks.listMcqsMock,
	createMcq: mocks.createMcqMock,
}));

import { GET, POST } from "@/app/api/mcqs/route";

const authenticatedUser = {
	id: "user-1",
	full_name: "Jane Doe",
	email: "jane@example.com",
};

const validPayload = {
	name: "Photosynthesis Basics",
	question: "Which organelle conducts photosynthesis?",
	choices: [
		{ choice_text: "Mitochondria", is_correct: false },
		{ choice_text: "Chloroplast", is_correct: true },
	],
};

describe("Phase 2: /api/mcqs route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireApiAuthMock.mockResolvedValue(authenticatedUser);
	});

	it("returns 200 with list payload for authenticated users", async () => {
		mocks.listMcqsMock.mockResolvedValueOnce({
			data: [{ id: "mcq-1", name: "Q1", question: "Text", choice_count: 2 }],
			total: 1,
		});

		const response = await GET(new Request("http://localhost/api/mcqs?limit=10&offset=0"));
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.data).toHaveLength(1);
		expect(body.meta).toEqual({ limit: 10, offset: 0, total: 1 });
	});

	it("returns 401 when listing without authentication", async () => {
		mocks.requireApiAuthMock.mockResolvedValueOnce(
			NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required." } }, { status: 401 }),
		);

		const response = await GET(new Request("http://localhost/api/mcqs"));

		expect(response.status).toBe(401);
		expect(mocks.listMcqsMock).not.toHaveBeenCalled();
	});

	it("returns 201 when creating a valid MCQ", async () => {
		mocks.createMcqMock.mockResolvedValueOnce({
			id: "mcq-1",
			...validPayload,
			created_by_user_id: "user-1",
			created_at: "2026-09-04T10:00:00.000Z",
			updated_at: "2026-09-04T10:00:00.000Z",
			choices: [
				{ id: "choice-1", choice_text: "Mitochondria", is_correct: false },
				{ id: "choice-2", choice_text: "Chloroplast", is_correct: true },
			],
		});

		const response = await POST(
			new Request("http://localhost/api/mcqs", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(validPayload),
			}),
		);
		const body = await response.json();

		expect(response.status).toBe(201);
		expect(body.data.id).toBe("mcq-1");
		expect(mocks.createMcqMock).toHaveBeenCalledWith("user-1", validPayload);
	});

	it("returns 400 when question text is missing", async () => {
		const { createMcqSchema } = await import("@/lib/validations/mcq");
		const parsed = createMcqSchema.safeParse({ ...validPayload, question: "" });

		if (!parsed.success) {
			mocks.createMcqMock.mockRejectedValueOnce(parsed.error);
		}

		const response = await POST(
			new Request("http://localhost/api/mcqs", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ...validPayload, question: "" }),
			}),
		);

		expect(response.status).toBe(400);
	});

	it("returns 400 when only one choice is provided", async () => {
		const { createMcqSchema } = await import("@/lib/validations/mcq");
		const parsed = createMcqSchema.safeParse({
			...validPayload,
			choices: [{ choice_text: "Only choice", is_correct: true }],
		});

		if (!parsed.success) {
			mocks.createMcqMock.mockRejectedValueOnce(parsed.error);
		}

		const response = await POST(
			new Request("http://localhost/api/mcqs", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...validPayload,
					choices: [{ choice_text: "Only choice", is_correct: true }],
				}),
			}),
		);
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body.error.code).toBe("TOO_FEW_CHOICES");
	});

	it("returns 401 when creating without authentication", async () => {
		mocks.requireApiAuthMock.mockResolvedValueOnce(
			NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required." } }, { status: 401 }),
		);

		const response = await POST(
			new Request("http://localhost/api/mcqs", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(validPayload),
			}),
		);

		expect(response.status).toBe(401);
		expect(mocks.createMcqMock).not.toHaveBeenCalled();
	});
});
