import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
	default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("@/app/sign-up/actions", () => ({
	signUpAction: vi.fn(),
}));

import { SignUpForm } from "@/components/auth/sign-up-form";

describe("Phase 4: sign-up form UI", () => {
	it("renders all required fields and navigation link", () => {
		render(<SignUpForm />);

		expect(screen.getByText("Create your account")).toBeInTheDocument();
		expect(screen.getByLabelText("Full Name")).toBeInTheDocument();
		expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
		expect(screen.getByLabelText("Password")).toBeInTheDocument();
		expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Create Account" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/sign-in");
	});
});
