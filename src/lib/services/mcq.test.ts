import "@/test/mcq-d1-mock";

import {
	createMcq,
	deleteMcq,
	getMcqById,
	recordAttempt,
	updateMcq,
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

describe("Phase 2: MCQ service integration", () => {
	beforeEach(() => {
		getMcqD1State().reset();
		vi.clearAllMocks();
	});

	it("supports full CRUD lifecycle", async () => {
		seedMcqUser();

		const created = await createMcq("user-1", validInput);
		const fetched = await getMcqById(created.id);
		const updated = await updateMcq(created.id, {
			...validInput,
			name: "Updated Name",
			question: "Updated question?",
		});

		expect(fetched?.id).toBe(created.id);
		expect(updated.name).toBe("Updated Name");

		await deleteMcq(created.id);

		expect(await getMcqById(created.id)).toBeNull();
	});

	it("rejects updates with invalid choice counts", async () => {
		seedMcqUser();
		const created = await createMcq("user-1", validInput);

		await expect(
			updateMcq(created.id, {
				...validInput,
				choices: Array.from({ length: 7 }, (_, index) => ({
					choice_text: `Choice ${index + 1}`,
					is_correct: index === 0,
				})),
			}),
		).rejects.toThrow();
	});

	it("records attempt correctness against known choice ids", async () => {
		seedMcqUser();
		const created = await createMcq("user-1", validInput);
		const correctChoice = created.choices.find((choice) => choice.is_correct)!;

		const attempt = await recordAttempt(created.id, "user-1", {
			selected_choice_id: correctChoice.id,
		});

		expect(attempt.is_correct).toBe(true);
		expect(attempt.selected_choice_id).toBe(correctChoice.id);
	});

	it("stamps created_by_user_id from the authenticated user", async () => {
		seedMcqUser("teacher-1");

		const created = await createMcq("teacher-1", validInput);

		expect(created.created_by_user_id).toBe("teacher-1");
	});

	it("rolls back failed updates without changing the original MCQ", async () => {
		seedMcqUser();
		const created = await createMcq("user-1", validInput);
		getMcqD1State().setFailNextChoiceInsert(true);

		await expect(
			updateMcq(created.id, {
				...validInput,
				name: "Broken Update",
			}),
		).rejects.toThrow("Simulated choice insert failure");

		const unchanged = await getMcqById(created.id);

		expect(unchanged?.name).toBe(validInput.name);
		expect(unchanged?.choices).toHaveLength(2);
	});

	it("rejects updates when attempts already exist for the MCQ", async () => {
		seedMcqUser();
		const created = await createMcq("user-1", validInput);
		const correctChoice = created.choices.find((choice) => choice.is_correct)!;

		await recordAttempt(created.id, "user-1", {
			selected_choice_id: correctChoice.id,
		});

		await expect(
			updateMcq(created.id, {
				...validInput,
				name: "Blocked Update",
			}),
		).rejects.toThrow("MCQ_HAS_ATTEMPTS");
	});
});
