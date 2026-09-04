import { logoutAction } from "@/app/dashboard/actions";
import { McqDashboard } from "@/components/mcq/mcq-dashboard";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth/current-user";
import { listMcqs } from "@/lib/services/mcq";

export default async function DashboardPage() {
	const user = await requireAuth();
	const { data: initialMcqs } = await listMcqs();

	return (
		<McqDashboard
			userName={user.full_name}
			initialMcqs={initialMcqs}
			logoutControl={
				<form action={logoutAction}>
					<Button type="submit" variant="outline">
						Log out
					</Button>
				</form>
			}
		/>
	);
}
