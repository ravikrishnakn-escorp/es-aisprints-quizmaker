import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getMcqValidationCode } from "@/lib/validations/mcq";

const serviceErrorMessages: Record<string, string> = {
	MCQ_NOT_FOUND: "Question not found.",
	CHOICE_NOT_FOUND: "Choice not found.",
	CHOICE_MCQ_MISMATCH: "The selected choice does not belong to this question.",
	MCQ_HAS_ATTEMPTS: "This question cannot be updated because attempts already exist.",
	USER_NOT_FOUND: "User not found.",
};

export function handleMcqRouteError(error: unknown): NextResponse {
	if (error instanceof ZodError) {
		return NextResponse.json(
			{
				error: {
					code: getMcqValidationCode(error) ?? "VALIDATION_ERROR",
					message: "Validation failed.",
					details: error.issues,
				},
			},
			{ status: 400 },
		);
	}

	if (error instanceof Error) {
		if (error.message === "MCQ_NOT_FOUND" || error.message === "CHOICE_NOT_FOUND") {
			return NextResponse.json(
				{
					error: {
						code: error.message,
						message: serviceErrorMessages[error.message],
					},
				},
				{ status: 404 },
			);
		}

		if (error.message === "CHOICE_MCQ_MISMATCH") {
			return NextResponse.json(
				{
					error: {
						code: error.message,
						message: serviceErrorMessages[error.message],
					},
				},
				{ status: 400 },
			);
		}

		if (error.message === "MCQ_HAS_ATTEMPTS") {
			return NextResponse.json(
				{
					error: {
						code: error.message,
						message: serviceErrorMessages[error.message],
					},
				},
				{ status: 409 },
			);
		}

		if (error.message === "USER_NOT_FOUND") {
			return NextResponse.json(
				{
					error: {
						code: error.message,
						message: serviceErrorMessages[error.message],
					},
				},
				{ status: 404 },
			);
		}
	}

	return NextResponse.json(
		{
			error: {
				code: "INTERNAL_ERROR",
				message: "Something went wrong. Please try again.",
			},
		},
		{ status: 500 },
	);
}
