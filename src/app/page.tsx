import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function Home() {
	return (
		<main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
			<div className="w-full max-w-md">
				<Card>
					<CardHeader>
						<CardTitle className="text-xl">Quiz Maker</CardTitle>
						<CardDescription>Create and take quizzes with ease.</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-3">
						<Link href="/sign-up" className={cn(buttonVariants({ size: "lg" }), "h-10")}>
							Sign Up
						</Link>
						<Link href="/sign-in" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10")}>
							Sign In
						</Link>
					</CardContent>
				</Card>
			</div>
		</main>
	);
}
