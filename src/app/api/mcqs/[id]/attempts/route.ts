import { NextResponse } from "next/server";

import { requireApiAuth } from "@/lib/api/auth";
import { handleMcqRouteError } from "@/lib/api/mcq-errors";
import { recordAttempt } from "@/lib/services/mcq";
import type { RecordAttemptInput } from "@/lib/validations/mcq";

type RouteContext = {
	params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
	const auth = await requireApiAuth();

	if (auth instanceof NextResponse) {
		return auth;
	}

	try {
		const { id } = await context.params;
		const body = (await request.json()) as RecordAttemptInput;
		const data = await recordAttempt(id, auth.id, body);

		return NextResponse.json({ data }, { status: 201 });
	} catch (error) {
		return handleMcqRouteError(error);
	}
}
