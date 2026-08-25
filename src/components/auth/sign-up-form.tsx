"use client";

import { useActionState } from "react";

import { signUpAction } from "@/app/sign-up/actions";
import { AuthLink, AuthShell } from "@/components/auth/auth-shell";
import { getFieldAccessibility } from "@/components/auth/field-accessibility";
import { SubmitButton } from "@/components/auth/submit-button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { initialAuthFormState } from "@/lib/auth/types";

export function SignUpForm() {
	const [state, formAction] = useActionState(signUpAction, initialAuthFormState);
	const fullNameField = getFieldAccessibility(state.fieldErrors, "fullName");
	const emailField = getFieldAccessibility(state.fieldErrors, "email");
	const passwordField = getFieldAccessibility(state.fieldErrors, "password");
	const confirmPasswordField = getFieldAccessibility(state.fieldErrors, "confirmPassword");

	return (
		<AuthShell
			title="Create your account"
			description="Sign up to start using Quiz Maker."
			footer={
				<>
					Already have an account? <AuthLink href="/sign-in">Sign in</AuthLink>
				</>
			}
		>
			<form action={formAction} className="space-y-6">
				<FieldGroup>
					<Field data-invalid={Boolean(state.fieldErrors?.fullName)}>
						<FieldLabel htmlFor="fullName">Full Name</FieldLabel>
						<Input id="fullName" name="fullName" autoComplete="name" required {...fullNameField.inputProps} />
						<FieldError
							id={fullNameField.errorId}
							errors={state.fieldErrors?.fullName?.map((message) => ({ message }))}
						/>
					</Field>

					<Field data-invalid={Boolean(state.fieldErrors?.email)}>
						<FieldLabel htmlFor="email">Email Address</FieldLabel>
						<Input id="email" name="email" type="email" autoComplete="email" required {...emailField.inputProps} />
						<FieldError id={emailField.errorId} errors={state.fieldErrors?.email?.map((message) => ({ message }))} />
					</Field>

					<Field data-invalid={Boolean(state.fieldErrors?.password)}>
						<FieldLabel htmlFor="password">Password</FieldLabel>
						<Input
							id="password"
							name="password"
							type="password"
							autoComplete="new-password"
							required
							{...passwordField.inputProps}
						/>
						<FieldError
							id={passwordField.errorId}
							errors={state.fieldErrors?.password?.map((message) => ({ message }))}
						/>
					</Field>

					<Field data-invalid={Boolean(state.fieldErrors?.confirmPassword)}>
						<FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
						<Input
							id="confirmPassword"
							name="confirmPassword"
							type="password"
							autoComplete="new-password"
							required
							{...confirmPasswordField.inputProps}
						/>
						<FieldError
							id={confirmPasswordField.errorId}
							errors={state.fieldErrors?.confirmPassword?.map((message) => ({ message }))}
						/>
					</Field>
				</FieldGroup>

				{state.formError ? <FieldError>{state.formError}</FieldError> : null}

				<SubmitButton pendingLabel="Creating account...">Create Account</SubmitButton>
			</form>
		</AuthShell>
	);
}
