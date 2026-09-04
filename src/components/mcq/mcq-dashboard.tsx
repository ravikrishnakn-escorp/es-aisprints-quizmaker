import type { ReactNode } from "react";

import { McqTable } from "@/components/mcq/mcq-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { McqListItem } from "@/lib/services/mcq";

type McqDashboardProps = {
	userName: string;
	logoutControl: ReactNode;
	initialMcqs: McqListItem[];
};

export function McqDashboard({ userName, logoutControl, initialMcqs }: McqDashboardProps) {
	return (
		<main className="min-h-screen bg-background px-4 py-8">
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
				<Card>
					<CardHeader className="flex flex-row items-start justify-between gap-4">
						<div>
							<CardTitle className="text-xl">Dashboard</CardTitle>
							<CardDescription>Welcome, {userName}.</CardDescription>
						</div>
						{logoutControl}
					</CardHeader>
					<CardContent>
						<McqTable key={initialMcqs.map((mcq) => mcq.id).join(",")} initialMcqs={initialMcqs} />
					</CardContent>
				</Card>
			</div>
		</main>
	);
}
