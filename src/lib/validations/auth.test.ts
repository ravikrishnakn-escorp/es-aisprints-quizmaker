import { describe, expect, it } from "vitest";

import { signInSchema, signUpSchema, toFieldErrors } from "@/lib/validations/auth";

const validSignUp = {
	fullName: "Jane Doe",
	email: "jane@example.com",
	password: "Password1!",
	confirmPassword: "Password1!",
};

describe("Phase 2: sign-up validation", () => {
	it("accepts valid sign-up input", () => {
		expect(signUpSchema.safeParse(validSignUp).success).toBe(true);
	});

	it("requires full name", () => {
		const result = signUpSchema.safeParse({ ...validSignUp, fullName: "   " });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(toFieldErrors(result.error).fullName).toContain("Full name is required.");
		}
	});

	it("requires email", () => {
		const result = signUpSchema.safeParse({ ...validSignUp, email: "" });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(toFieldErrors(result.error).email).toContain("Email address is required.");
		}
	});

	it("rejects invalid email format", () => {
		const result = signUpSchema.safeParse({ ...validSignUp, email: "not-an-email" });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(toFieldErrors(result.error).email).toContain("Please enter a valid email address.");
		}
	});

	it("requires password", () => {
		const result = signUpSchema.safeParse({ ...validSignUp, password: "" });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(toFieldErrors(result.error).password).toContain("Password is required.");
		}
	});

	it("enforces minimum password length", () => {
		const result = signUpSchema.safeParse({ ...validSignUp, password: "Pass1!", confirmPassword: "Pass1!" });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(toFieldErrors(result.error).password).toContain("Password must be at least 8 characters.");
		}
	});

	it("requires an uppercase letter", () => {
		const result = signUpSchema.safeParse({
			...validSignUp,
			password: "password1!",
			confirmPassword: "password1!",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(toFieldErrors(result.error).password).toContain("Password must contain at least one uppercase letter.");
		}
	});

	it("requires a lowercase letter", () => {
		const result = signUpSchema.safeParse({
			...validSignUp,
			password: "PASSWORD1!",
			confirmPassword: "PASSWORD1!",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(toFieldErrors(result.error).password).toContain("Password must contain at least one lowercase letter.");
		}
	});

	it("requires a number", () => {
		const result = signUpSchema.safeParse({
			...validSignUp,
			password: "Password!",
			confirmPassword: "Password!",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(toFieldErrors(result.error).password).toContain("Password must contain at least one number.");
		}
	});

	it("requires a special character", () => {
		const result = signUpSchema.safeParse({
			...validSignUp,
			password: "Password1",
			confirmPassword: "Password1",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(toFieldErrors(result.error).password).toContain("Password must contain at least one special character.");
		}
	});

	it("requires confirm password", () => {
		const result = signUpSchema.safeParse({ ...validSignUp, confirmPassword: "" });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(toFieldErrors(result.error).confirmPassword).toContain("Please confirm your password.");
		}
	});

	it("rejects mismatched passwords", () => {
		const result = signUpSchema.safeParse({ ...validSignUp, confirmPassword: "Password2!" });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(toFieldErrors(result.error).confirmPassword).toContain("Passwords do not match.");
		}
	});
});

describe("Phase 2: sign-in validation", () => {
	it("accepts valid sign-in input", () => {
		expect(signInSchema.safeParse({ email: "jane@example.com", password: "Password1!" }).success).toBe(true);
	});

	it("requires email", () => {
		const result = signInSchema.safeParse({ email: "", password: "Password1!" });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(toFieldErrors(result.error).email).toContain("Email address is required.");
		}
	});

	it("rejects invalid email format", () => {
		const result = signInSchema.safeParse({ email: "bad-email", password: "Password1!" });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(toFieldErrors(result.error).email).toContain("Please enter a valid email address.");
		}
	});

	it("requires password", () => {
		const result = signInSchema.safeParse({ email: "jane@example.com", password: "" });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(toFieldErrors(result.error).password).toContain("Password is required.");
		}
	});
});
