import { describe, expect, it } from "vitest";

import {
	createMcqSchema,
	getMcqValidationCode,
	recordAttemptSchema,
} from "@/lib/validations/mcq";

const validMcq = {
	name: "Photosynthesis Basics",
	question: "Which organelle conducts photosynthesis?",
	choices: [
		{ choice_text: "Mitochondria", is_correct: false },
		{ choice_text: "Chloroplast", is_correct: true },
	],
};

describe("Phase 1: MCQ validation", () => {
	it("accepts a valid payload with two choices and one correct answer", () => {
		expect(createMcqSchema.safeParse(validMcq).success).toBe(true);
	});

	it("rejects an empty name", () => {
		const result = createMcqSchema.safeParse({ ...validMcq, name: "" });
		expect(result.success).toBe(false);
	});

	it("rejects an empty question", () => {
		const result = createMcqSchema.safeParse({ ...validMcq, question: "   " });
		expect(result.success).toBe(false);
	});

	it("rejects fewer than two choices", () => {
		const result = createMcqSchema.safeParse({
			...validMcq,
			choices: [{ choice_text: "Only choice", is_correct: true }],
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(getMcqValidationCode(result.error)).toBe("TOO_FEW_CHOICES");
		}
	});

	it("rejects more than six choices", () => {
		const result = createMcqSchema.safeParse({
			...validMcq,
			choices: Array.from({ length: 7 }, (_, index) => ({
				choice_text: `Choice ${index + 1}`,
				is_correct: index === 0,
			})),
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(getMcqValidationCode(result.error)).toBe("TOO_MANY_CHOICES");
		}
	});

	it("rejects zero correct answers", () => {
		const result = createMcqSchema.safeParse({
			...validMcq,
			choices: [
				{ choice_text: "Mitochondria", is_correct: false },
				{ choice_text: "Chloroplast", is_correct: false },
			],
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(getMcqValidationCode(result.error)).toBe("EXACTLY_ONE_CORRECT");
		}
	});

	it("rejects multiple correct answers", () => {
		const result = createMcqSchema.safeParse({
			...validMcq,
			choices: [
				{ choice_text: "Mitochondria", is_correct: true },
				{ choice_text: "Chloroplast", is_correct: true },
			],
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(getMcqValidationCode(result.error)).toBe("EXACTLY_ONE_CORRECT");
		}
	});

	it("rejects whitespace-only choice text", () => {
		const result = createMcqSchema.safeParse({
			...validMcq,
			choices: [
				{ choice_text: "   ", is_correct: false },
				{ choice_text: "Chloroplast", is_correct: true },
			],
		});

		expect(result.success).toBe(false);
	});

	it("requires selected_choice_id for attempt payloads", () => {
		const result = recordAttemptSchema.safeParse({});
		expect(result.success).toBe(false);
	});
});
