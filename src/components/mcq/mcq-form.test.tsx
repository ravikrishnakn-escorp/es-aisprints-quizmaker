import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	pushMock: vi.fn(),
	refreshMock: vi.fn(),
	createMcqRequestMock: vi.fn(),
	updateMcqRequestMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: mocks.pushMock,
		refresh: mocks.refreshMock,
	}),
}));

vi.mock("@/lib/api/mcq-client", () => ({
	createMcqRequest: mocks.createMcqRequestMock,
	updateMcqRequest: mocks.updateMcqRequestMock,
}));

import { McqForm } from "@/components/mcq/mcq-form";

const initialData = {
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
};

describe("Phase 3: MCQ form", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.createMcqRequestMock.mockResolvedValue({ data: initialData });
		mocks.updateMcqRequestMock.mockResolvedValue({ data: initialData });
	});

	it("renders two default choice rows on create", () => {
		render(<McqForm mode="create" />);

		expect(screen.getByLabelText("Choice 1")).toBeInTheDocument();
		expect(screen.getByLabelText("Choice 2")).toBeInTheDocument();
	});

	it("adds choice rows up to six", async () => {
		const user = userEvent.setup();
		render(<McqForm mode="create" />);

		await user.click(screen.getByRole("button", { name: "Add choice" }));
		await user.click(screen.getByRole("button", { name: "Add choice" }));
		await user.click(screen.getByRole("button", { name: "Add choice" }));
		await user.click(screen.getByRole("button", { name: "Add choice" }));

		expect(screen.getByLabelText("Choice 6")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Add choice" })).toBeDisabled();
	});

	it("removes a choice row when more than two exist", async () => {
		const user = userEvent.setup();
		render(<McqForm mode="create" />);

		await user.click(screen.getByRole("button", { name: "Add choice" }));
		expect(screen.getByLabelText("Choice 3")).toBeInTheDocument();

		await user.click(screen.getAllByRole("button", { name: "Remove" })[2]);
		expect(screen.queryByLabelText("Choice 3")).not.toBeInTheDocument();
	});

	it("keeps remove disabled when only two choices remain", () => {
		render(<McqForm mode="create" />);

		expect(screen.getAllByRole("button", { name: "Remove" })).toHaveLength(2);
		for (const button of screen.getAllByRole("button", { name: "Remove" })) {
			expect(button).toBeDisabled();
		}
	});

	it("allows only one correct radio selection", async () => {
		const user = userEvent.setup();
		render(<McqForm mode="create" />);

		const radios = screen.getAllByRole("radio");
		expect(radios[0]).toBeChecked();

		await user.click(radios[1]);
		expect(radios[1]).toBeChecked();
		expect(radios[0]).not.toBeChecked();
	});

	it("submits create payload to the API", async () => {
		const user = userEvent.setup();
		render(<McqForm mode="create" />);

		await user.type(screen.getByLabelText("Question Name"), "Math Basics");
		await user.type(screen.getByLabelText("Question Text"), "What is 2 + 2?");
		await user.type(screen.getByLabelText("Choice 1"), "3");
		await user.type(screen.getByLabelText("Choice 2"), "4");
		await user.click(screen.getAllByRole("radio")[1]);
		await user.click(screen.getByRole("button", { name: "Save" }));

		await waitFor(() => {
			expect(mocks.createMcqRequestMock).toHaveBeenCalledWith({
				name: "Math Basics",
				question: "What is 2 + 2?",
				choices: [
					{ choice_text: "3", is_correct: false },
					{ choice_text: "4", is_correct: true },
				],
			});
		});
	});

	it("disables save while submitting", async () => {
		const user = userEvent.setup();
		let resolveCreate: (value: { data: typeof initialData }) => void = () => undefined;
		mocks.createMcqRequestMock.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolveCreate = resolve;
				}),
		);

		render(<McqForm mode="create" />);

		await user.type(screen.getByLabelText("Question Name"), "Math Basics");
		await user.type(screen.getByLabelText("Question Text"), "What is 2 + 2?");
		await user.type(screen.getByLabelText("Choice 1"), "3");
		await user.type(screen.getByLabelText("Choice 2"), "4");
		await user.click(screen.getByRole("button", { name: "Save" }));

		expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();

		resolveCreate({ data: initialData });
		await waitFor(() => {
			expect(mocks.pushMock).toHaveBeenCalledWith("/dashboard");
		});
	});

	it("navigates back to dashboard on cancel without calling the API", async () => {
		const user = userEvent.setup();
		render(<McqForm mode="create" />);

		await user.click(screen.getByRole("button", { name: "Cancel" }));

		expect(mocks.pushMock).toHaveBeenCalledWith("/dashboard");
		expect(mocks.createMcqRequestMock).not.toHaveBeenCalled();
	});

	it("shows validation errors for empty name", async () => {
		const user = userEvent.setup();
		render(<McqForm mode="create" />);

		await user.click(screen.getByRole("button", { name: "Save" }));

		expect(await screen.findByText("Name is required.")).toBeInTheDocument();
		expect(mocks.createMcqRequestMock).not.toHaveBeenCalled();
	});

	it("pre-fills fields in edit mode", () => {
		render(<McqForm mode="edit" mcqId="mcq-1" initialData={initialData} />);

		expect(screen.getByLabelText("Question Name")).toHaveValue("Existing Question");
		expect(screen.getByLabelText("Question Text")).toHaveValue("What is 2 + 2?");
		expect(screen.getByLabelText("Choice 1")).toHaveValue("3");
		expect(screen.getByLabelText("Choice 2")).toHaveValue("4");
	});

	it("submits update payload to the API in edit mode", async () => {
		const user = userEvent.setup();
		render(<McqForm mode="edit" mcqId="mcq-1" initialData={initialData} />);

		await user.clear(screen.getByLabelText("Question Name"));
		await user.type(screen.getByLabelText("Question Name"), "Updated Question");
		await user.click(screen.getByRole("button", { name: "Save" }));

		await waitFor(() => {
			expect(mocks.updateMcqRequestMock).toHaveBeenCalledWith("mcq-1", {
				name: "Updated Question",
				question: "What is 2 + 2?",
				choices: [
					{ choice_text: "3", is_correct: false },
					{ choice_text: "4", is_correct: true },
				],
			});
		});
	});
});
