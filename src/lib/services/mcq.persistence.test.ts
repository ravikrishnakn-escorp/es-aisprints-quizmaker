import "@/test/mcq-d1-mock";

import {
	createMcq,
	deleteMcq,
	listMcqs,
	recordAttempt,
} from "@/lib/services/mcq";
import { getMcqD1State, seedMcqUser } from "@/test/mcq-d1-mock";
import type { CreateMcqInput } from "@/lib/validations/mcq";
import { beforeEach, describe, expect, it, vi } from "vitest";

const validInput: CreateMcqInput = {
	name: "Photosynthesis Basics",
	question: "Which organelle conducts photosynthesis?",
	choices: [
		{ choice_text: "Mitochondria", is_correct: false },
		{ choice_text: "Chloroplast", is_correct: true },
	],
};

describe("Phase 1: MCQ persistence", () => {
	beforeEach(() => {
		getMcqD1State().reset();
		vi.clearAllMocks();
	});

	it("creates an MCQ and its choices atomically", async () => {
		seedMcqUser();

		const mcq = await createMcq("user-1", validInput);

		expect(getMcqD1State().mcqs).toHaveLength(1);
		expect(getMcqD1State().choices).toHaveLength(2);
		expect(mcq.name).toBe(validInput.name);
		expect(mcq.choices).toHaveLength(2);
	});

	it("rolls back MCQ creation when a choice insert fails", async () => {
		seedMcqUser();
		getMcqD1State().setFailNextChoiceInsert(true);

		await expect(createMcq("user-1", validInput)).rejects.toThrow("Simulated choice insert failure");
		expect(getMcqD1State().mcqs).toHaveLength(0);
		expect(getMcqD1State().choices).toHaveLength(0);
	});

	it("rejects MCQ creation when created_by_user_id does not exist", async () => {
		await expect(createMcq("missing-user", validInput)).rejects.toThrow("USER_NOT_FOUND");
		expect(getMcqD1State().mcqs).toHaveLength(0);
	});

	it("cascade deletes choices when an MCQ is deleted", async () => {
		seedMcqUser();
		const mcq = await createMcq("user-1", validInput);

		await deleteMcq(mcq.id);

		expect(getMcqD1State().mcqs).toHaveLength(0);
		expect(getMcqD1State().choices).toHaveLength(0);
	});

	it("cascade deletes attempts when an MCQ is deleted", async () => {
		seedMcqUser();
		const mcq = await createMcq("user-1", validInput);
		const correctChoice = mcq.choices.find((choice) => choice.is_correct);

		await recordAttempt(mcq.id, "user-1", { selected_choice_id: correctChoice!.id });
		expect(getMcqD1State().attempts).toHaveLength(1);

		await deleteMcq(mcq.id);

		expect(getMcqD1State().attempts).toHaveLength(0);
	});

	it("rejects MCQ creation with one choice before database insert", async () => {
		seedMcqUser();

		await expect(
			createMcq("user-1", {
				...validInput,
				choices: [{ choice_text: "Only choice", is_correct: true }],
			}),
		).rejects.toThrow();
		expect(getMcqD1State().mcqs).toHaveLength(0);
	});

	it("rejects MCQ creation with seven choices before database insert", async () => {
		seedMcqUser();

		await expect(
			createMcq("user-1", {
				...validInput,
				choices: Array.from({ length: 7 }, (_, index) => ({
					choice_text: `Choice ${index + 1}`,
					is_correct: index === 0,
				})),
			}),
		).rejects.toThrow();
		expect(getMcqD1State().mcqs).toHaveLength(0);
	});

	it("records whether an attempt is correct", async () => {
		seedMcqUser();
		const mcq = await createMcq("user-1", validInput);
		const correctChoice = mcq.choices.find((choice) => choice.is_correct)!;
		const incorrectChoice = mcq.choices.find((choice) => !choice.is_correct)!;

		const correctAttempt = await recordAttempt(mcq.id, "user-1", {
			selected_choice_id: correctChoice.id,
		});
		const incorrectAttempt = await recordAttempt(mcq.id, "user-1", {
			selected_choice_id: incorrectChoice.id,
		});

		expect(correctAttempt.is_correct).toBe(true);
		expect(incorrectAttempt.is_correct).toBe(false);
	});

	it("rejects attempts when the selected choice belongs to a different MCQ", async () => {
		seedMcqUser();
		const firstMcq = await createMcq("user-1", validInput);
		const secondMcq = await createMcq("user-1", {
			...validInput,
			name: "Second Question",
		});
		const foreignChoice = secondMcq.choices[0];

		await expect(
			recordAttempt(firstMcq.id, "user-1", { selected_choice_id: foreignChoice.id }),
		).rejects.toThrow("CHOICE_MCQ_MISMATCH");
	});

	it("lists MCQs with choice counts", async () => {
		seedMcqUser();
		await createMcq("user-1", validInput);
		await createMcq("user-1", {
			...validInput,
			name: "Cell Basics",
			choices: [
				{ choice_text: "Nucleus", is_correct: false },
				{ choice_text: "Ribosome", is_correct: true },
				{ choice_text: "Vacuole", is_correct: false },
			],
		});

		const result = await listMcqs();

		expect(result.data).toHaveLength(2);
		expect(result.data.some((item) => item.choice_count === 2)).toBe(true);
		expect(result.data.some((item) => item.choice_count === 3)).toBe(true);
	});
});
