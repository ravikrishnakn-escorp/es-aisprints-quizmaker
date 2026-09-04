import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
	default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("@/lib/auth/current-user", () => ({
	requireAuth: vi.fn(async () => ({
		id: "user-1",
		full_name: "Jane Doe",
		email: "jane@example.com",
	})),
}));

vi.mock("@/lib/services/mcq", () => ({
	getMcqById: vi.fn(async () => ({
		id: "mcq-1",
		name: "Existing Question",
		question: "What is 2 + 2?",
		created_by_user_id: "user-1",
		created_at: "2026-09-04T10:00:00.000Z",
		updated_at: "2026-09-04T10:00:00.000Z",
		choices: [
			{ id: "choice-1", choice_text: "3", is_correct: false },
			{ id: "choice-2", choice_text: "4", is_correct: true },
		],
	})),
}));

vi.mock("@/components/mcq/mcq-form", () => ({
	McqForm: ({ initialData }: { initialData?: { name: string } }) => (
		<div data-testid="mcq-form">{initialData?.name}</div>
	),
}));

import EditQuestionPage from "@/app/dashboard/questions/[id]/edit/page";

describe("Phase 3: edit question page", () => {
	it("renders the edit form with loaded data", async () => {
		render(
			await EditQuestionPage({
				params: Promise.resolve({ id: "mcq-1" }),
			}),
		);

		expect(screen.getByText("Edit Question")).toBeInTheDocument();
		expect(screen.getByTestId("mcq-form")).toHaveTextContent("Existing Question");
	});
});
