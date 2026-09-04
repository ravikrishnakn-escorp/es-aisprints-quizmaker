import {
	createMcq,
	deleteMcq,
	listMcqs,
	recordAttempt,
} from "@/lib/services/mcq";
import type { CreateMcqInput } from "@/lib/validations/mcq";
import { beforeEach, describe, expect, it, vi } from "vitest";

type UserRow = {
	id: string;
	full_name: string;
	email: string;
	password_hash: string;
	created_at: string;
	updated_at: string;
};

type McqRow = {
	id: string;
	name: string;
	question: string;
	created_by_user_id: string;
	created_at: string;
	updated_at: string;
};

type ChoiceRow = {
	id: string;
	mcq_id: string;
	choice_text: string;
	is_correct: number;
	created_at: string;
	updated_at: string;
};

type AttemptRow = {
	id: string;
	mcq_id: string;
	user_id: string;
	selected_choice_id: string;
	is_correct: number;
	attempted_at: string;
};

const d1State = vi.hoisted(() => {
	const users: UserRow[] = [];
	const mcqs: McqRow[] = [];
	const choices: ChoiceRow[] = [];
	const attempts: AttemptRow[] = [];
	let failNextChoiceInsert = false;

	function snapshot() {
		return {
			users: structuredClone(users),
			mcqs: structuredClone(mcqs),
			choices: structuredClone(choices),
			attempts: structuredClone(attempts),
		};
	}

	function restore(saved: ReturnType<typeof snapshot>) {
		users.splice(0, users.length, ...saved.users);
		mcqs.splice(0, mcqs.length, ...saved.mcqs);
		choices.splice(0, choices.length, ...saved.choices);
		attempts.splice(0, attempts.length, ...saved.attempts);
	}

	function createBoundStatement(sql: string, bindings: unknown[]) {
		return {
			sql,
			bindings,
			async all<T>() {
				if (sql.includes("SELECT id FROM users WHERE id")) {
					const userId = String(bindings[0]);
					return { results: users.filter((user) => user.id === userId).map((user) => ({ id: user.id })) as T[] };
				}

				if (sql.includes("SELECT COUNT(*) as total FROM mcq")) {
					return { results: [{ total: mcqs.length }] as T[] };
				}

				if (sql.includes("COUNT(c.id) AS choice_count")) {
					const limit = Number(bindings[0]);
					const offset = Number(bindings[1]);
					const rows = mcqs
						.slice()
						.sort((a, b) => b.created_at.localeCompare(a.created_at))
						.slice(offset, offset + limit)
						.map((mcq) => ({
							...mcq,
							choice_count: choices.filter((choice) => choice.mcq_id === mcq.id).length,
						}));

					return { results: rows as T[] };
				}

				if (sql.includes("FROM mcq WHERE id")) {
					const mcqId = String(bindings[0]);
					return { results: mcqs.filter((mcq) => mcq.id === mcqId) as T[] };
				}

				if (sql.includes("FROM mcq_choices WHERE mcq_id")) {
					const mcqId = String(bindings[0]);
					return {
						results: choices
							.filter((choice) => choice.mcq_id === mcqId)
							.sort((a, b) => a.created_at.localeCompare(b.created_at)) as T[],
					};
				}

				if (sql.includes("FROM mcq_choices WHERE id")) {
					const choiceId = String(bindings[0]);
					return { results: choices.filter((choice) => choice.id === choiceId) as T[] };
				}

				if (sql.includes("FROM mcq_attempts WHERE mcq_id")) {
					const mcqId = String(bindings[0]);
					return { results: attempts.filter((attempt) => attempt.mcq_id === mcqId) as T[] };
				}

				if (sql.includes("FROM mcq_attempts WHERE id")) {
					const attemptId = String(bindings[0]);
					return { results: attempts.filter((attempt) => attempt.id === attemptId) as T[] };
				}

				return { results: [] as T[] };
			},
			async run() {
				if (sql.includes("INSERT INTO mcq (")) {
					const [id, name, question, createdByUserId] = bindings as [string, string, string, string];
					const userExists = users.some((user) => user.id === createdByUserId);

					if (!userExists) {
						throw new Error("FOREIGN KEY constraint failed");
					}

					mcqs.push({
						id,
						name,
						question,
						created_by_user_id: createdByUserId,
						created_at: new Date().toISOString(),
						updated_at: new Date().toISOString(),
					});
				}

				if (sql.includes("INSERT INTO mcq_choices")) {
					if (failNextChoiceInsert) {
						failNextChoiceInsert = false;
						throw new Error("Simulated choice insert failure");
					}

					const [id, mcqId, choiceText, isCorrect] = bindings as [string, string, string, number];
					choices.push({
						id,
						mcq_id: mcqId,
						choice_text: choiceText,
						is_correct: isCorrect,
						created_at: new Date().toISOString(),
						updated_at: new Date().toISOString(),
					});
				}

				if (sql.includes("INSERT INTO mcq_attempts")) {
					const [id, mcqId, userId, selectedChoiceId, isCorrect] = bindings as [
						string,
						string,
						string,
						string,
						number,
					];

					attempts.push({
						id,
						mcq_id: mcqId,
						user_id: userId,
						selected_choice_id: selectedChoiceId,
						is_correct: isCorrect,
						attempted_at: new Date().toISOString(),
					});
				}

				if (sql.includes("DELETE FROM mcq WHERE id")) {
					const mcqId = String(bindings[0]);
					const mcqIndex = mcqs.findIndex((mcq) => mcq.id === mcqId);

					if (mcqIndex >= 0) {
						mcqs.splice(mcqIndex, 1);
					}

					for (let index = choices.length - 1; index >= 0; index -= 1) {
						if (choices[index].mcq_id === mcqId) {
							choices.splice(index, 1);
						}
					}

					for (let index = attempts.length - 1; index >= 0; index -= 1) {
						if (attempts[index].mcq_id === mcqId) {
							attempts.splice(index, 1);
						}
					}
				}

				return { success: true };
			},
		};
	}

	const db = {
		prepare(sql: string) {
			const statement = {
				bind(...bindings: unknown[]) {
					return createBoundStatement(sql, bindings);
				},
				async all<T>() {
					return createBoundStatement(sql, []).all<T>();
				},
			};

			return statement;
		},
		async batch(statements: Array<ReturnType<typeof createBoundStatement>>) {
			const saved = snapshot();

			try {
				for (const statement of statements) {
					await statement.run();
				}
			} catch (error) {
				restore(saved);
				throw error;
			}

			return statements.map(() => ({ success: true }));
		},
	};

	return {
		users,
		mcqs,
		choices,
		attempts,
		db,
		setFailNextChoiceInsert(value: boolean) {
			failNextChoiceInsert = value;
		},
		reset() {
			users.length = 0;
			mcqs.length = 0;
			choices.length = 0;
			attempts.length = 0;
			failNextChoiceInsert = false;
		},
	};
});

vi.mock("@/lib/db", () => ({
	getDb: vi.fn(async () => d1State.db),
}));

const validInput: CreateMcqInput = {
	name: "Photosynthesis Basics",
	question: "Which organelle conducts photosynthesis?",
	choices: [
		{ choice_text: "Mitochondria", is_correct: false },
		{ choice_text: "Chloroplast", is_correct: true },
	],
};

function seedUser(id = "user-1") {
	d1State.users.push({
		id,
		full_name: "Jane Doe",
		email: "jane@example.com",
		password_hash: "hash",
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
	});
}

describe("Phase 1: MCQ persistence", () => {
	beforeEach(() => {
		d1State.reset();
		vi.clearAllMocks();
	});

	it("creates an MCQ and its choices atomically", async () => {
		seedUser();

		const mcq = await createMcq("user-1", validInput);

		expect(d1State.mcqs).toHaveLength(1);
		expect(d1State.choices).toHaveLength(2);
		expect(mcq.name).toBe(validInput.name);
		expect(mcq.choices).toHaveLength(2);
	});

	it("rolls back MCQ creation when a choice insert fails", async () => {
		seedUser();
		d1State.setFailNextChoiceInsert(true);

		await expect(createMcq("user-1", validInput)).rejects.toThrow("Simulated choice insert failure");
		expect(d1State.mcqs).toHaveLength(0);
		expect(d1State.choices).toHaveLength(0);
	});

	it("rejects MCQ creation when created_by_user_id does not exist", async () => {
		await expect(createMcq("missing-user", validInput)).rejects.toThrow("USER_NOT_FOUND");
		expect(d1State.mcqs).toHaveLength(0);
	});

	it("cascade deletes choices when an MCQ is deleted", async () => {
		seedUser();
		const mcq = await createMcq("user-1", validInput);

		await deleteMcq(mcq.id);

		expect(d1State.mcqs).toHaveLength(0);
		expect(d1State.choices).toHaveLength(0);
	});

	it("cascade deletes attempts when an MCQ is deleted", async () => {
		seedUser();
		const mcq = await createMcq("user-1", validInput);
		const correctChoice = mcq.choices.find((choice) => choice.is_correct);

		await recordAttempt(mcq.id, "user-1", { selected_choice_id: correctChoice!.id });
		expect(d1State.attempts).toHaveLength(1);

		await deleteMcq(mcq.id);

		expect(d1State.attempts).toHaveLength(0);
	});

	it("rejects MCQ creation with one choice before database insert", async () => {
		seedUser();

		await expect(
			createMcq("user-1", {
				...validInput,
				choices: [{ choice_text: "Only choice", is_correct: true }],
			}),
		).rejects.toThrow();
		expect(d1State.mcqs).toHaveLength(0);
	});

	it("rejects MCQ creation with seven choices before database insert", async () => {
		seedUser();

		await expect(
			createMcq("user-1", {
				...validInput,
				choices: Array.from({ length: 7 }, (_, index) => ({
					choice_text: `Choice ${index + 1}`,
					is_correct: index === 0,
				})),
			}),
		).rejects.toThrow();
		expect(d1State.mcqs).toHaveLength(0);
	});

	it("records whether an attempt is correct", async () => {
		seedUser();
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
		seedUser();
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
		seedUser();
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
