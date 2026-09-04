import { vi } from "vitest";

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

const mcqD1State = vi.hoisted(() => {
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

				if (sql.includes("UPDATE mcq SET")) {
					const [name, question, mcqId] = bindings as [string, string, string];
					const mcq = mcqs.find((row) => row.id === mcqId);

					if (mcq) {
						mcq.name = name;
						mcq.question = question;
						mcq.updated_at = new Date().toISOString();
					}
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

				if (sql.includes("DELETE FROM mcq_choices WHERE mcq_id")) {
					const mcqId = String(bindings[0]);

					for (let index = choices.length - 1; index >= 0; index -= 1) {
						if (choices[index].mcq_id === mcqId) {
							choices.splice(index, 1);
						}
					}
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
			return {
				bind(...bindings: unknown[]) {
					return createBoundStatement(sql, bindings);
				},
				async all<T>() {
					return createBoundStatement(sql, []).all<T>();
				},
			};
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
	getDb: vi.fn(async () => mcqD1State.db),
}));

export function getMcqD1State() {
	return mcqD1State;
}

export function seedMcqUser(id = "user-1") {
	mcqD1State.users.push({
		id,
		full_name: "Jane Doe",
		email: "jane@example.com",
		password_hash: "hash",
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
	});
}
