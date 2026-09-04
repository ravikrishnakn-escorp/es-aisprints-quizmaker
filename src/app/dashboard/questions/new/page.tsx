import Link from "next/link";

import { McqForm } from "@/components/mcq/mcq-form";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/current-user";

export default async function NewQuestionPage() {
	await requireAuth();

	return (
		<main className="min-h-screen bg-background px-4 py-8">
			<div className="mx-auto w-full max-w-3xl space-y-4">
				<Link href="/dashboard" className={buttonVariants({ variant: "outline", size: "sm" })}>
					Back to dashboard
				</Link>
				<Card>
					<CardHeader>
						<CardTitle>Create New Question</CardTitle>
						<CardDescription>Add a multiple-choice question with 2 to 6 answer choices.</CardDescription>
					</CardHeader>
					<CardContent>
						<McqForm mode="create" />
					</CardContent>
				</Card>
			</div>
		</main>
	);
}
