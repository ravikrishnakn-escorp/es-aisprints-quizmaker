"use client";

import { useActionState } from "react";

import { signInAction } from "@/app/sign-in/actions";
import { AuthLink, AuthShell } from "@/components/auth/auth-shell";
import { getFieldAccessibility } from "@/components/auth/field-accessibility";
import { SubmitButton } from "@/components/auth/submit-button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { initialAuthFormState } from "@/lib/auth/types";

type SignInFormProps = {
	successMessage?: string;
};

export function SignInForm({ successMessage }: SignInFormProps) {
	const [state, formAction] = useActionState(signInAction, initialAuthFormState);
	const emailField = getFieldAccessibility(state.fieldErrors, "email");
	const passwordField = getFieldAccessibility(state.fieldErrors, "password");

	return (
		<AuthShell
			title="Sign in to Quiz Maker"
			description="Enter your credentials to access your account."
			footer={
				<>
					Don&apos;t have an account? <AuthLink href="/sign-up">Sign up</AuthLink>
				</>
			}
		>
			<form action={formAction} className="space-y-6">
				{successMessage ? (
					<p className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground" role="status">
						{successMessage}
					</p>
				) : null}

				<FieldGroup>
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
							autoComplete="current-password"
							required
							{...passwordField.inputProps}
						/>
						<FieldError
							id={passwordField.errorId}
							errors={state.fieldErrors?.password?.map((message) => ({ message }))}
						/>
					</Field>
				</FieldGroup>

				{state.formError ? <FieldError>{state.formError}</FieldError> : null}

				<SubmitButton pendingLabel="Signing in...">Sign In</SubmitButton>
			</form>
		</AuthShell>
	);
}
