import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
	default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
		<a href={href} className={className}>
			{children}
		</a>
	),
}));

import Home from "@/app/page";

describe("Phase 4: home page navigation", () => {
	it("renders Quiz Maker landing content", () => {
		render(<Home />);

		expect(screen.getByText("Quiz Maker")).toBeInTheDocument();
		expect(screen.getByText("Create and take quizzes with ease.")).toBeInTheDocument();
	});

	it("links to sign-up and sign-in pages", () => {
		render(<Home />);

		expect(screen.getByRole("link", { name: "Sign Up" })).toHaveAttribute("href", "/sign-up");
		expect(screen.getByRole("link", { name: "Sign In" })).toHaveAttribute("href", "/sign-in");
	});
});
