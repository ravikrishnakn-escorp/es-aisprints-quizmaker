import { redirectIfAuthenticated } from "@/lib/auth/current-user";
import { SignUpForm } from "@/components/auth/sign-up-form";

export default async function SignUpPage() {
	await redirectIfAuthenticated();

	return <SignUpForm />;
}
