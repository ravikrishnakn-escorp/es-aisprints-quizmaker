"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createMcqRequest, updateMcqRequest } from "@/lib/api/mcq-client";
import type { McqWithChoices } from "@/lib/services/mcq";
import { createMcqSchema } from "@/lib/validations/mcq";
import { cn } from "@/lib/utils";

type ChoiceDraft = {
	choice_text: string;
	is_correct: boolean;
};

type McqFormProps = {
	mode: "create" | "edit";
	mcqId?: string;
	initialData?: McqWithChoices;
};

function buildDefaultChoices(): ChoiceDraft[] {
	return [
		{ choice_text: "", is_correct: true },
		{ choice_text: "", is_correct: false },
	];
}

function mapInitialChoices(initialData?: McqWithChoices): ChoiceDraft[] {
	if (!initialData) {
		return buildDefaultChoices();
	}

	return initialData.choices.map((choice) => ({
		choice_text: choice.choice_text,
		is_correct: choice.is_correct,
	}));
}

export function McqForm({ mode, mcqId, initialData }: McqFormProps) {
	const router = useRouter();
	const [name, setName] = useState(initialData?.name ?? "");
	const [question, setQuestion] = useState(initialData?.question ?? "");
	const [choices, setChoices] = useState<ChoiceDraft[]>(() => mapInitialChoices(initialData));
	const [formError, setFormError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	function setChoiceText(index: number, value: string) {
		setChoices((current) => current.map((choice, choiceIndex) => (choiceIndex === index ? { ...choice, choice_text: value } : choice)));
	}

	function setCorrectChoice(index: number) {
		setChoices((current) =>
			current.map((choice, choiceIndex) => ({
				...choice,
				is_correct: choiceIndex === index,
			})),
		);
	}

	function addChoice() {
		setChoices((current) => {
			if (current.length >= 6) {
				return current;
			}

			return [...current, { choice_text: "", is_correct: false }];
		});
	}

	function removeChoice(index: number) {
		setChoices((current) => {
			if (current.length <= 2) {
				return current;
			}

			const next = current.filter((_, choiceIndex) => choiceIndex !== index);

			if (!next.some((choice) => choice.is_correct)) {
				next[0].is_correct = true;
			}

			return next;
		});
	}

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setFormError(null);
		setFieldErrors({});

		const payload = { name, question, choices };
		const parsed = createMcqSchema.safeParse(payload);

		if (!parsed.success) {
			const nextFieldErrors: Record<string, string> = {};

			for (const issue of parsed.error.issues) {
				const field = issue.path[0];

				if (typeof field === "string" && !nextFieldErrors[field]) {
					nextFieldErrors[field] = issue.message;
				}
			}

			setFieldErrors(nextFieldErrors);
			return;
		}

		setIsSubmitting(true);

		try {
			if (mode === "create") {
				await createMcqRequest(parsed.data);
			} else if (mcqId) {
				await updateMcqRequest(mcqId, parsed.data);
			}

			router.push("/dashboard");
			router.refresh();
		} catch (error) {
			setFormError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<FieldGroup>
				<Field data-invalid={Boolean(fieldErrors.name)}>
					<FieldLabel htmlFor="mcq-name">Question Name</FieldLabel>
					<Input
						id="mcq-name"
						value={name}
						onChange={(event) => setName(event.target.value)}
						placeholder="Short identifier, e.g. Chapter 1 Q3"
						aria-invalid={Boolean(fieldErrors.name)}
					/>
					<FieldError errors={fieldErrors.name ? [{ message: fieldErrors.name }] : undefined} />
				</Field>

				<Field data-invalid={Boolean(fieldErrors.question)}>
					<FieldLabel htmlFor="mcq-question">Question Text</FieldLabel>
					<textarea
						id="mcq-question"
						value={question}
						onChange={(event) => setQuestion(event.target.value)}
						placeholder="Enter the full question"
						rows={4}
						aria-invalid={Boolean(fieldErrors.question)}
						className={cn(
							"w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30",
						)}
					/>
					<FieldError errors={fieldErrors.question ? [{ message: fieldErrors.question }] : undefined} />
				</Field>

				<div className="space-y-4">
					<div>
						<FieldLabel>Choices</FieldLabel>
						<FieldDescription>Provide 2 to 6 choices and select exactly one correct answer.</FieldDescription>
					</div>

					{choices.map((choice, index) => (
						<div key={`choice-${index}`} className="flex items-start gap-3 rounded-lg border border-border p-3">
							<input
								type="radio"
								name="correct-choice"
								checked={choice.is_correct}
								onChange={() => setCorrectChoice(index)}
								aria-label={`Mark choice ${index + 1} as correct`}
								className="mt-2"
							/>
							<div className="flex-1 space-y-2">
								<FieldLabel htmlFor={`choice-${index}`}>Choice {index + 1}</FieldLabel>
								<Input
									id={`choice-${index}`}
									value={choice.choice_text}
									onChange={(event) => setChoiceText(index, event.target.value)}
									placeholder="Enter choice text"
								/>
							</div>
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={choices.length <= 2}
								onClick={() => removeChoice(index)}
							>
								Remove
							</Button>
						</div>
					))}

					<Button type="button" variant="outline" onClick={addChoice} disabled={choices.length >= 6}>
						Add choice
					</Button>
					<FieldError errors={fieldErrors.choices ? [{ message: fieldErrors.choices }] : undefined} />
				</div>
			</FieldGroup>

			{formError ? <FieldError>{formError}</FieldError> : null}

			<div className="flex flex-wrap gap-3">
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? "Saving..." : "Save"}
				</Button>
				<Button type="button" variant="outline" disabled={isSubmitting} onClick={() => router.push("/dashboard")}>
					Cancel
				</Button>
			</div>
		</form>
	);
}
