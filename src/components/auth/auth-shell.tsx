import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AuthShellProps = {
	title: string;
	description: string;
	children: React.ReactNode;
	footer: React.ReactNode;
};

export function AuthShell({ title, description, children, footer }: AuthShellProps) {
	return (
		<main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
			<div className="w-full max-w-md">
				<Card>
					<CardHeader>
						<CardTitle className="text-xl">{title}</CardTitle>
						<CardDescription>{description}</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">{children}</CardContent>
				</Card>
				<p className="mt-4 text-center text-sm text-muted-foreground">{footer}</p>
			</div>
		</main>
	);
}

export function AuthLink({ href, children }: { href: string; children: React.ReactNode }) {
	return (
		<Link href={href} className="font-medium text-foreground underline-offset-4 hover:underline">
			{children}
		</Link>
	);
}
