import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
	default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("@/app/sign-in/actions", () => ({
	signInAction: vi.fn(),
}));

import { SignInForm } from "@/components/auth/sign-in-form";

describe("Phase 4: sign-in form UI", () => {
	it("renders required fields, submit button, and sign-up link", () => {
		render(<SignInForm />);

		expect(screen.getByText("Sign in to Quiz Maker")).toBeInTheDocument();
		expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
		expect(screen.getByLabelText("Password")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute("href", "/sign-up");
	});

	it("shows registration success message when provided", () => {
		render(<SignInForm successMessage="Account created successfully. Please sign in." />);

		expect(screen.getByRole("status")).toHaveTextContent("Account created successfully. Please sign in.");
	});
});
