import { logoutAction } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/current-user";

export default async function DashboardPage() {
	const user = await requireAuth();

	return (
		<main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="text-xl">Dashboard</CardTitle>
					<CardDescription>Welcome, {user.full_name}.</CardDescription>
				</CardHeader>
				<CardContent>
					<form action={logoutAction}>
						<Button type="submit" variant="outline">
							Log out
						</Button>
					</form>
				</CardContent>
			</Card>
		</main>
	);
}
