import { getDb } from "@/lib/db";
import {
	createMcqSchema,
	recordAttemptSchema,
	updateMcqSchema,
	type CreateMcqInput,
	type RecordAttemptInput,
} from "@/lib/validations/mcq";

export type McqChoice = {
	id: string;
	choice_text: string;
	is_correct: boolean;
};

export type McqRecord = {
	id: string;
	name: string;
	question: string;
	created_by_user_id: string;
	created_at: string;
	updated_at: string;
};

export type McqWithChoices = McqRecord & {
	choices: McqChoice[];
};

export type McqListItem = McqRecord & {
	choice_count: number;
};

export type McqAttempt = {
	id: string;
	mcq_id: string;
	user_id: string;
	selected_choice_id: string;
	is_correct: boolean;
	attempted_at: string;
};

function generateId(): string {
	return crypto.randomUUID().replace(/-/g, "");
}

function mapChoice(row: { id: string; choice_text: string; is_correct: number }): McqChoice {
	return {
		id: row.id,
		choice_text: row.choice_text,
		is_correct: row.is_correct === 1,
	};
}

async function userExists(userId: string): Promise<boolean> {
	const db = await getDb();
	const { results } = await db.prepare("SELECT id FROM users WHERE id = ?1").bind(userId).all<{ id: string }>();

	return results.length > 0;
}

export async function createMcq(userId: string, input: CreateMcqInput): Promise<McqWithChoices> {
	const parsed = createMcqSchema.parse(input);

	if (!(await userExists(userId))) {
		throw new Error("USER_NOT_FOUND");
	}

	const db = await getDb();
	const mcqId = generateId();
	const statements = [
		db
			.prepare("INSERT INTO mcq (id, name, question, created_by_user_id) VALUES (?1, ?2, ?3, ?4)")
			.bind(mcqId, parsed.name, parsed.question, userId),
		...parsed.choices.map((choice) =>
			db
				.prepare("INSERT INTO mcq_choices (id, mcq_id, choice_text, is_correct) VALUES (?1, ?2, ?3, ?4)")
				.bind(generateId(), mcqId, choice.choice_text, choice.is_correct ? 1 : 0),
		),
	];

	await db.batch(statements);

	const mcq = await getMcqById(mcqId);

	if (!mcq) {
		throw new Error("Failed to create MCQ.");
	}

	return mcq;
}

export async function listMcqs(options?: {
	limit?: number;
	offset?: number;
}): Promise<{ data: McqListItem[]; total: number }> {
	const limit = options?.limit ?? 50;
	const offset = options?.offset ?? 0;
	const db = await getDb();

	const { results: countResults } = await db.prepare("SELECT COUNT(*) as total FROM mcq").all<{ total: number }>();

	const { results } = await db
		.prepare(
			`SELECT m.id, m.name, m.question, m.created_by_user_id, m.created_at, m.updated_at,
              COUNT(c.id) AS choice_count
       FROM mcq m
       LEFT JOIN mcq_choices c ON c.mcq_id = m.id
       GROUP BY m.id
       ORDER BY m.created_at DESC
       LIMIT ?1 OFFSET ?2`,
		)
		.bind(limit, offset)
		.all<McqListItem>();

	return {
		data: results.map((row) => ({
			...row,
			choice_count: Number(row.choice_count),
		})),
		total: Number(countResults[0]?.total ?? 0),
	};
}

export async function getMcqById(id: string): Promise<McqWithChoices | null> {
	const db = await getDb();
	const { results: mcqResults } = await db
		.prepare("SELECT id, name, question, created_by_user_id, created_at, updated_at FROM mcq WHERE id = ?1")
		.bind(id)
		.all<McqRecord>();

	const mcq = mcqResults[0];

	if (!mcq) {
		return null;
	}

	const { results: choiceResults } = await db
		.prepare("SELECT id, choice_text, is_correct FROM mcq_choices WHERE mcq_id = ?1 ORDER BY created_at ASC")
		.bind(id)
		.all<{ id: string; choice_text: string; is_correct: number }>();

	return {
		...mcq,
		choices: choiceResults.map(mapChoice),
	};
}

export async function updateMcq(id: string, input: CreateMcqInput): Promise<McqWithChoices> {
	const parsed = updateMcqSchema.parse(input);
	const existing = await getMcqById(id);

	if (!existing) {
		throw new Error("MCQ_NOT_FOUND");
	}

	const db = await getDb();
	const { results: attemptResults } = await db
		.prepare("SELECT id FROM mcq_attempts WHERE mcq_id = ?1 LIMIT 1")
		.bind(id)
		.all<{ id: string }>();

	if (attemptResults.length > 0) {
		throw new Error("MCQ_HAS_ATTEMPTS");
	}

	const statements = [
		db
			.prepare("UPDATE mcq SET name = ?1, question = ?2, updated_at = CURRENT_TIMESTAMP WHERE id = ?3")
			.bind(parsed.name, parsed.question, id),
		db.prepare("DELETE FROM mcq_choices WHERE mcq_id = ?1").bind(id),
		...parsed.choices.map((choice) =>
			db
				.prepare("INSERT INTO mcq_choices (id, mcq_id, choice_text, is_correct) VALUES (?1, ?2, ?3, ?4)")
				.bind(generateId(), id, choice.choice_text, choice.is_correct ? 1 : 0),
		),
	];

	await db.batch(statements);

	const updated = await getMcqById(id);

	if (!updated) {
		throw new Error("Failed to update MCQ.");
	}

	return updated;
}

export async function deleteMcq(id: string): Promise<void> {
	const existing = await getMcqById(id);

	if (!existing) {
		throw new Error("MCQ_NOT_FOUND");
	}

	const db = await getDb();
	await db.prepare("DELETE FROM mcq WHERE id = ?1").bind(id).run();
}

export async function recordAttempt(
	mcqId: string,
	userId: string,
	input: RecordAttemptInput,
): Promise<McqAttempt> {
	const parsed = recordAttemptSchema.parse(input);
	const mcq = await getMcqById(mcqId);

	if (!mcq) {
		throw new Error("MCQ_NOT_FOUND");
	}

	if (!(await userExists(userId))) {
		throw new Error("USER_NOT_FOUND");
	}

	const db = await getDb();
	const { results: choiceResults } = await db
		.prepare("SELECT id, mcq_id, is_correct FROM mcq_choices WHERE id = ?1")
		.bind(parsed.selected_choice_id)
		.all<{ id: string; mcq_id: string; is_correct: number }>();

	const choice = choiceResults[0];

	if (!choice) {
		throw new Error("CHOICE_NOT_FOUND");
	}

	if (choice.mcq_id !== mcqId) {
		throw new Error("CHOICE_MCQ_MISMATCH");
	}

	const attemptId = generateId();
	const isCorrect = choice.is_correct === 1 ? 1 : 0;

	await db
		.prepare(
			"INSERT INTO mcq_attempts (id, mcq_id, user_id, selected_choice_id, is_correct) VALUES (?1, ?2, ?3, ?4, ?5)",
		)
		.bind(attemptId, mcqId, userId, parsed.selected_choice_id, isCorrect)
		.run();

	const { results } = await db
		.prepare(
			"SELECT id, mcq_id, user_id, selected_choice_id, is_correct, attempted_at FROM mcq_attempts WHERE id = ?1",
		)
		.bind(attemptId)
		.all<{
			id: string;
			mcq_id: string;
			user_id: string;
			selected_choice_id: string;
			is_correct: number;
			attempted_at: string;
		}>();

	const attempt = results[0];

	if (!attempt) {
		throw new Error("Failed to record attempt.");
	}

	return {
		id: attempt.id,
		mcq_id: attempt.mcq_id,
		user_id: attempt.user_id,
		selected_choice_id: attempt.selected_choice_id,
		is_correct: attempt.is_correct === 1,
		attempted_at: attempt.attempted_at,
	};
}
