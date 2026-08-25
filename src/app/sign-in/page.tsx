import { SignInForm } from "@/components/auth/sign-in-form";
import { redirectIfAuthenticated } from "@/lib/auth/current-user";

type SignInPageProps = {
	searchParams: Promise<{
		success?: string;
	}>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
	await redirectIfAuthenticated();

	const params = await searchParams;
	const successMessage =
		params.success === "registered" ? "Account created successfully. Please sign in." : undefined;

	return <SignInForm successMessage={successMessage} />;
}
