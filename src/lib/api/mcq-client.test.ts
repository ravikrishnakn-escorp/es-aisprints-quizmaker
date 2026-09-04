import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { McqApiError, createMcqRequest, deleteMcqRequest, fetchMcqs } from "@/lib/api/mcq-client";

describe("Phase 2: MCQ API client", () => {
	beforeEach(() => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => ({
				ok: true,
				json: async () => ({
					data: [{ id: "mcq-1", name: "Q1", question: "Text", choice_count: 2 }],
					meta: { limit: 50, offset: 0, total: 1 },
				}),
			})),
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("fetches MCQs with credentials included", async () => {
		const result = await fetchMcqs();

		expect(fetch).toHaveBeenCalledWith("/api/mcqs", { credentials: "include" });
		expect(result.data).toHaveLength(1);
	});

	it("creates an MCQ with JSON payload", async () => {
		vi.mocked(fetch).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ data: { id: "mcq-1" } }),
		} as Response);

		await createMcqRequest({
			name: "Q1",
			question: "Text?",
			choices: [
				{ choice_text: "A", is_correct: false },
				{ choice_text: "B", is_correct: true },
			],
		});

		expect(fetch).toHaveBeenCalledWith("/api/mcqs", {
			method: "POST",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				name: "Q1",
				question: "Text?",
				choices: [
					{ choice_text: "A", is_correct: false },
					{ choice_text: "B", is_correct: true },
				],
			}),
		});
	});

	it("throws McqApiError when delete fails", async () => {
		vi.mocked(fetch).mockResolvedValueOnce({
			ok: false,
			status: 404,
			json: async () => ({
				error: { code: "MCQ_NOT_FOUND", message: "Question not found." },
			}),
		} as Response);

		await expect(deleteMcqRequest("missing")).rejects.toMatchObject({
			code: "MCQ_NOT_FOUND",
			status: 404,
		} satisfies Partial<McqApiError>);
	});
});
