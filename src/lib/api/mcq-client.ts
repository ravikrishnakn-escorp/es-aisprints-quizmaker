import type { McqAttempt, McqListItem, McqWithChoices } from "@/lib/services/mcq";
import type { CreateMcqInput, RecordAttemptInput } from "@/lib/validations/mcq";

type ApiErrorBody = {
	error?: {
		code?: string;
		message?: string;
		details?: unknown[];
	};
};

export class McqApiError extends Error {
	code: string;
	status: number;

	constructor(message: string, code: string, status: number) {
		super(message);
		this.code = code;
		this.status = status;
	}
}

async function parseResponse<T>(response: Response): Promise<T> {
	const body = (await response.json()) as T & ApiErrorBody;

	if (!response.ok) {
		throw new McqApiError(
			body.error?.message ?? "Request failed.",
			body.error?.code ?? "REQUEST_FAILED",
			response.status,
		);
	}

	return body;
}

export async function fetchMcqs(): Promise<{ data: McqListItem[]; meta: { limit: number; offset: number; total: number } }> {
	const response = await fetch("/api/mcqs", { credentials: "include" });
	return parseResponse(response);
}

export async function fetchMcq(id: string): Promise<{ data: McqWithChoices }> {
	const response = await fetch(`/api/mcqs/${id}`, { credentials: "include" });
	return parseResponse(response);
}

export async function createMcqRequest(input: CreateMcqInput): Promise<{ data: McqWithChoices }> {
	const response = await fetch("/api/mcqs", {
		method: "POST",
		credentials: "include",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});

	return parseResponse(response);
}

export async function updateMcqRequest(id: string, input: CreateMcqInput): Promise<{ data: McqWithChoices }> {
	const response = await fetch(`/api/mcqs/${id}`, {
		method: "PUT",
		credentials: "include",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});

	return parseResponse(response);
}

export async function deleteMcqRequest(id: string): Promise<void> {
	const response = await fetch(`/api/mcqs/${id}`, {
		method: "DELETE",
		credentials: "include",
	});

	if (!response.ok) {
		const body = (await response.json()) as ApiErrorBody;
		throw new McqApiError(
			body.error?.message ?? "Request failed.",
			body.error?.code ?? "REQUEST_FAILED",
			response.status,
		);
	}
}

export async function recordAttemptRequest(
	mcqId: string,
	input: RecordAttemptInput,
): Promise<{ data: McqAttempt }> {
	const response = await fetch(`/api/mcqs/${mcqId}/attempts`, {
		method: "POST",
		credentials: "include",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});

	return parseResponse(response);
}
