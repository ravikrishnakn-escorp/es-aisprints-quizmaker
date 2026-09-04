import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
	default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/mcq/mcq-table", () => ({
	McqTable: () => <div data-testid="mcq-table">MCQ table</div>,
}));

import { McqDashboard } from "@/components/mcq/mcq-dashboard";

describe("Phase 3: dashboard UI", () => {
	it("renders the MCQ table", () => {
		render(
			<McqDashboard
				userName="Jane Doe"
				initialMcqs={[]}
				logoutControl={<button type="submit">Log out</button>}
			/>,
		);

		expect(screen.getByTestId("mcq-table")).toBeInTheDocument();
	});

	it("shows welcome message and logout control", () => {
		render(
			<McqDashboard
				userName="Jane Doe"
				initialMcqs={[]}
				logoutControl={<button type="submit">Log out</button>}
			/>,
		);

		expect(screen.getByText("Welcome, Jane Doe.")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
	});
});
