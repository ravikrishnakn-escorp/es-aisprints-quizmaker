import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { handleMcqRouteError } from "@/lib/api/mcq-errors";
import { createMcqSchema } from "@/lib/validations/mcq";

describe("Phase 2: MCQ route error handling", () => {
	it("maps Zod validation errors to 400", async () => {
		const parsed = createMcqSchema.safeParse({
			name: "",
			question: "",
			choices: [{ choice_text: "Only", is_correct: true }],
		});

		if (!parsed.success) {
			const response = handleMcqRouteError(parsed.error);
			const body = await response.json();

			expect(response.status).toBe(400);
			expect(body.error.code).toBe("TOO_FEW_CHOICES");
		}
	});

	it("maps MCQ_NOT_FOUND to 404", async () => {
		const response = handleMcqRouteError(new Error("MCQ_NOT_FOUND"));
		const body = await response.json();

		expect(response.status).toBe(404);
		expect(body.error.code).toBe("MCQ_NOT_FOUND");
	});

	it("maps CHOICE_MCQ_MISMATCH to 400", async () => {
		const response = handleMcqRouteError(new Error("CHOICE_MCQ_MISMATCH"));
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body.error.code).toBe("CHOICE_MCQ_MISMATCH");
	});

	it("maps MCQ_HAS_ATTEMPTS to 409", async () => {
		const response = handleMcqRouteError(new Error("MCQ_HAS_ATTEMPTS"));
		const body = await response.json();

		expect(response.status).toBe(409);
		expect(body.error.code).toBe("MCQ_HAS_ATTEMPTS");
	});

	it("maps unknown errors to 500", async () => {
		const response = handleMcqRouteError(new Error("Unexpected failure"));
		const body = await response.json();

		expect(response.status).toBe(500);
		expect(body.error.code).toBe("INTERNAL_ERROR");
	});

	it("handles non-Error values as 500", async () => {
		const response = handleMcqRouteError("broken");
		const body = await response.json();

		expect(response.status).toBe(500);
		expect(body.error.code).toBe("INTERNAL_ERROR");
	});

	it("includes Zod issue details in validation responses", async () => {
		const error = new ZodError([]);
		const response = handleMcqRouteError(error);
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body.error.details).toEqual([]);
	});
});
