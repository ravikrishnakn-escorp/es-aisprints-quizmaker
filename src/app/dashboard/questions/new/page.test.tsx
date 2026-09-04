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

vi.mock("@/components/mcq/mcq-form", () => ({
	McqForm: () => <div data-testid="mcq-form">MCQ form</div>,
}));

import NewQuestionPage from "@/app/dashboard/questions/new/page";

describe("Phase 3: create question page", () => {
	it("renders the create form", async () => {
		render(await NewQuestionPage());

		expect(screen.getByText("Create New Question")).toBeInTheDocument();
		expect(screen.getByTestId("mcq-form")).toBeInTheDocument();
	});
});
