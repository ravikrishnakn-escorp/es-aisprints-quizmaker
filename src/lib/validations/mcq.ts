import { z } from "zod";

const mcqChoiceSchema = z.object({
	choice_text: z.string().trim().min(1, "Choice text is required.").max(500),
	is_correct: z.boolean(),
});

const mcqChoicesSchema = z
	.array(mcqChoiceSchema)
	.superRefine((choices, ctx) => {
		if (choices.length < 2) {
			ctx.addIssue({
				code: "custom",
				message: "An MCQ must have at least 2 choices.",
				path: ["choices"],
				params: { code: "TOO_FEW_CHOICES" },
			});
		}

		if (choices.length > 6) {
			ctx.addIssue({
				code: "custom",
				message: "An MCQ can have at most 6 choices.",
				path: ["choices"],
				params: { code: "TOO_MANY_CHOICES" },
			});
		}

		const correctCount = choices.filter((choice) => choice.is_correct).length;

		if (correctCount !== 1) {
			ctx.addIssue({
				code: "custom",
				message: "Exactly one choice must be marked as correct.",
				path: ["choices"],
				params: { code: "EXACTLY_ONE_CORRECT" },
			});
		}
	});

export const createMcqSchema = z.object({
	name: z.string().trim().min(1, "Name is required.").max(120),
	question: z.string().trim().min(1, "Question is required.").max(2000),
	choices: mcqChoicesSchema,
});

export const updateMcqSchema = createMcqSchema;

export const recordAttemptSchema = z.object({
	selected_choice_id: z.string().trim().min(1, "selected_choice_id is required."),
});

export type CreateMcqInput = z.infer<typeof createMcqSchema>;
export type UpdateMcqInput = z.infer<typeof updateMcqSchema>;
export type RecordAttemptInput = z.infer<typeof recordAttemptSchema>;

export type McqValidationCode = "TOO_FEW_CHOICES" | "TOO_MANY_CHOICES" | "EXACTLY_ONE_CORRECT";

export function getMcqValidationCode(error: z.ZodError): McqValidationCode | undefined {
	for (const issue of error.issues) {
		const params = "params" in issue ? issue.params : undefined;
		const code = params && typeof params === "object" && "code" in params ? params.code : undefined;

		if (
			code === "TOO_FEW_CHOICES" ||
			code === "TOO_MANY_CHOICES" ||
			code === "EXACTLY_ONE_CORRECT"
		) {
			return code;
		}
	}

	return undefined;
}
