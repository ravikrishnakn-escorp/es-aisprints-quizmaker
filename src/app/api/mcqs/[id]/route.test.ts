import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	requireApiAuthMock: vi.fn(),
	getMcqByIdMock: vi.fn(),
	updateMcqMock: vi.fn(),
	deleteMcqMock: vi.fn(),
}));

vi.mock("@/lib/api/auth", () => ({
	requireApiAuth: mocks.requireApiAuthMock,
}));

vi.mock("@/lib/services/mcq", () => ({
	getMcqById: mocks.getMcqByIdMock,
	updateMcq: mocks.updateMcqMock,
	deleteMcq: mocks.deleteMcqMock,
}));

import { DELETE, GET, PUT } from "@/app/api/mcqs/[id]/route";

const authenticatedUser = {
	id: "user-1",
	full_name: "Jane Doe",
	email: "jane@example.com",
};

const validPayload = {
	name: "Updated Question",
	question: "Updated text?",
	choices: [
		{ choice_text: "A", is_correct: false },
		{ choice_text: "B", is_correct: true },
	],
};

const routeContext = {
	params: Promise.resolve({ id: "mcq-1" }),
};

describe("Phase 2: /api/mcqs/[id] route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireApiAuthMock.mockResolvedValue(authenticatedUser);
	});

	it("returns 200 with MCQ and choices", async () => {
		mocks.getMcqByIdMock.mockResolvedValueOnce({
			id: "mcq-1",
			name: "Q1",
			question: "Text",
			created_by_user_id: "user-1",
			created_at: "2026-09-04T10:00:00.000Z",
			updated_at: "2026-09-04T10:00:00.000Z",
			choices: [{ id: "choice-1", choice_text: "A", is_correct: true }],
		});

		const response = await GET(new Request("http://localhost/api/mcqs/mcq-1"), routeContext);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.data.id).toBe("mcq-1");
	});

	it("returns 404 for unknown MCQ id", async () => {
		mocks.getMcqByIdMock.mockResolvedValueOnce(null);

		const response = await GET(new Request("http://localhost/api/mcqs/missing"), routeContext);
		const body = await response.json();

		expect(response.status).toBe(404);
		expect(body.error.code).toBe("MCQ_NOT_FOUND");
	});

	it("returns 200 when updating a valid MCQ", async () => {
		mocks.updateMcqMock.mockResolvedValueOnce({
			id: "mcq-1",
			...validPayload,
			created_by_user_id: "user-1",
			created_at: "2026-09-04T10:00:00.000Z",
			updated_at: "2026-09-04T11:00:00.000Z",
			choices: [
				{ id: "choice-1", choice_text: "A", is_correct: false },
				{ id: "choice-2", choice_text: "B", is_correct: true },
			],
		});

		const response = await PUT(
			new Request("http://localhost/api/mcqs/mcq-1", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(validPayload),
			}),
			routeContext,
		);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.data.name).toBe("Updated Question");
	});

	it("returns 400 when updating with seven choices", async () => {
		const { createMcqSchema } = await import("@/lib/validations/mcq");
		const invalidPayload = {
			...validPayload,
			choices: Array.from({ length: 7 }, (_, index) => ({
				choice_text: `Choice ${index + 1}`,
				is_correct: index === 0,
			})),
		};
		const parsed = createMcqSchema.safeParse(invalidPayload);

		if (!parsed.success) {
			mocks.updateMcqMock.mockRejectedValueOnce(parsed.error);
		}

		const response = await PUT(
			new Request("http://localhost/api/mcqs/mcq-1", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(invalidPayload),
			}),
			routeContext,
		);
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body.error.code).toBe("TOO_MANY_CHOICES");
	});

	it("returns 404 when updating unknown MCQ id", async () => {
		mocks.updateMcqMock.mockRejectedValueOnce(new Error("MCQ_NOT_FOUND"));

		const response = await PUT(
			new Request("http://localhost/api/mcqs/missing", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(validPayload),
			}),
			routeContext,
		);
		const body = await response.json();

		expect(response.status).toBe(404);
		expect(body.error.code).toBe("MCQ_NOT_FOUND");
	});

	it("returns 204 when deleting an existing MCQ", async () => {
		mocks.deleteMcqMock.mockResolvedValueOnce(undefined);

		const response = await DELETE(new Request("http://localhost/api/mcqs/mcq-1"), routeContext);

		expect(response.status).toBe(204);
		expect(mocks.deleteMcqMock).toHaveBeenCalledWith("mcq-1");
	});

	it("returns 404 when deleting unknown MCQ id", async () => {
		mocks.deleteMcqMock.mockRejectedValueOnce(new Error("MCQ_NOT_FOUND"));

		const response = await DELETE(new Request("http://localhost/api/mcqs/missing"), routeContext);
		const body = await response.json();

		expect(response.status).toBe(404);
		expect(body.error.code).toBe("MCQ_NOT_FOUND");
	});
});
