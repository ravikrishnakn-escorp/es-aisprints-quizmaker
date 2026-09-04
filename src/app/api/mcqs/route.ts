import { NextResponse } from "next/server";

import { requireApiAuth } from "@/lib/api/auth";
import { handleMcqRouteError } from "@/lib/api/mcq-errors";
import { createMcq, listMcqs } from "@/lib/services/mcq";
import type { CreateMcqInput } from "@/lib/validations/mcq";

export async function GET(request: Request) {
	const auth = await requireApiAuth();

	if (auth instanceof NextResponse) {
		return auth;
	}

	try {
		const url = new URL(request.url);
		const limit = Number(url.searchParams.get("limit") ?? "50");
		const offset = Number(url.searchParams.get("offset") ?? "0");
		const result = await listMcqs({ limit, offset });

		return NextResponse.json({
			data: result.data,
			meta: {
				limit,
				offset,
				total: result.total,
			},
		});
	} catch (error) {
		return handleMcqRouteError(error);
	}
}

export async function POST(request: Request) {
	const auth = await requireApiAuth();

	if (auth instanceof NextResponse) {
		return auth;
	}

	try {
		const body = (await request.json()) as CreateMcqInput;
		const data = await createMcq(auth.id, body);

		return NextResponse.json({ data }, { status: 201 });
	} catch (error) {
		return handleMcqRouteError(error);
	}
}
