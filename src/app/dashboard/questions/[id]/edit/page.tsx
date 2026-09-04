import Link from "next/link";
import { notFound } from "next/navigation";

import { McqForm } from "@/components/mcq/mcq-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/current-user";
import { getMcqById } from "@/lib/services/mcq";

type EditQuestionPageProps = {
	params: Promise<{ id: string }>;
};

export default async function EditQuestionPage({ params }: EditQuestionPageProps) {
	await requireAuth();
	const { id } = await params;
	const mcq = await getMcqById(id);

	if (!mcq) {
		notFound();
	}

	return (
		<main className="min-h-screen bg-background px-4 py-8">
			<div className="mx-auto w-full max-w-3xl space-y-4">
				<Button render={<Link href="/dashboard" />} variant="outline" size="sm">
					Back to dashboard
				</Button>
				<Card>
					<CardHeader>
						<CardTitle>Edit Question</CardTitle>
						<CardDescription>Update the question details and answer choices.</CardDescription>
					</CardHeader>
					<CardContent>
						<McqForm mode="edit" mcqId={mcq.id} initialData={mcq} />
					</CardContent>
				</Card>
			</div>
		</main>
	);
}
