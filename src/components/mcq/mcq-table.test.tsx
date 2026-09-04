import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	pushMock: vi.fn(),
	refreshMock: vi.fn(),
	fetchMcqsMock: vi.fn(),
	deleteMcqRequestMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: mocks.pushMock,
		refresh: mocks.refreshMock,
	}),
}));

vi.mock("next/link", () => ({
	default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("@/lib/api/mcq-client", () => ({
	fetchMcqs: mocks.fetchMcqsMock,
	deleteMcqRequest: mocks.deleteMcqRequestMock,
}));

import { McqTable } from "@/components/mcq/mcq-table";

const sampleMcqs = [
	{
		id: "mcq-1",
		name: "Photosynthesis Basics",
		question: "Which organelle conducts photosynthesis?",
		created_by_user_id: "user-1",
		created_at: "2026-09-04T10:00:00.000Z",
		updated_at: "2026-09-04T10:00:00.000Z",
		choice_count: 2,
	},
];

describe("Phase 3: MCQ table", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.fetchMcqsMock.mockResolvedValue({ data: sampleMcqs, meta: { limit: 50, offset: 0, total: 1 } });
		mocks.deleteMcqRequestMock.mockResolvedValue(undefined);
	});

	it("renders column headers", () => {
		render(<McqTable initialMcqs={sampleMcqs} />);

		expect(screen.getByText("Question Name")).toBeInTheDocument();
		expect(screen.getByText("Question Text")).toBeInTheDocument();
		expect(screen.getByText("Actions")).toBeInTheDocument();
	});

	it("renders row data from the provided list", () => {
		render(<McqTable initialMcqs={sampleMcqs} />);

		expect(screen.getByText("Photosynthesis Basics")).toBeInTheDocument();
		expect(screen.getByText("Which organelle conducts photosynthesis?")).toBeInTheDocument();
	});

	it("shows an empty state when there are no MCQs", () => {
		render(<McqTable initialMcqs={[]} />);

		expect(screen.getByText("No questions yet. Create your first question.")).toBeInTheDocument();
	});

	it("navigates to the create page when Create New Question is clicked", async () => {
		const user = userEvent.setup();
		render(<McqTable initialMcqs={[]} />);

		expect(screen.getByRole("link", { name: "Create New Question" })).toHaveAttribute(
			"href",
			"/dashboard/questions/new",
		);

		await user.click(screen.getByRole("link", { name: "Create New Question" }));
	});

	it("opens the actions menu with Edit and Delete options", async () => {
		const user = userEvent.setup();
		render(<McqTable initialMcqs={sampleMcqs} />);

		await user.click(screen.getByRole("button", { name: "Actions for Photosynthesis Basics" }));

		expect(screen.getByRole("menuitem", { name: "Edit" })).toBeInTheDocument();
		expect(screen.getByRole("menuitem", { name: "Delete" })).toBeInTheDocument();
	});

	it("navigates to edit when Edit is selected", async () => {
		const user = userEvent.setup();
		render(<McqTable initialMcqs={sampleMcqs} />);

		await user.click(screen.getByRole("button", { name: "Actions for Photosynthesis Basics" }));
		await user.click(screen.getByRole("menuitem", { name: "Edit" }));

		expect(mocks.pushMock).toHaveBeenCalledWith("/dashboard/questions/mcq-1/edit");
	});

	it("opens a delete confirmation dialog", async () => {
		const user = userEvent.setup();
		render(<McqTable initialMcqs={sampleMcqs} />);

		await user.click(screen.getByRole("button", { name: "Actions for Photosynthesis Basics" }));
		await user.click(screen.getByRole("menuitem", { name: "Delete" }));

		expect(screen.getByText("Delete question?")).toBeInTheDocument();
	});

	it("calls delete API and refreshes the list on confirm", async () => {
		const user = userEvent.setup();
		render(<McqTable initialMcqs={sampleMcqs} />);

		await user.click(screen.getByRole("button", { name: "Actions for Photosynthesis Basics" }));
		await user.click(screen.getByRole("menuitem", { name: "Delete" }));
		await user.click(screen.getByRole("button", { name: "Delete" }));

		await waitFor(() => {
			expect(mocks.deleteMcqRequestMock).toHaveBeenCalledWith("mcq-1");
		});
	});
});
