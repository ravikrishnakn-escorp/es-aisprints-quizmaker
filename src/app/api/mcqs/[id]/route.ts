import { NextResponse } from "next/server";

import { requireApiAuth } from "@/lib/api/auth";
import { handleMcqRouteError } from "@/lib/api/mcq-errors";
import { deleteMcq, getMcqById, updateMcq } from "@/lib/services/mcq";
import type { CreateMcqInput } from "@/lib/validations/mcq";

type RouteContext = {
	params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
	const auth = await requireApiAuth();

	if (auth instanceof NextResponse) {
		return auth;
	}

	try {
		const { id } = await context.params;
		const data = await getMcqById(id);

		if (!data) {
			return NextResponse.json(
				{
					error: {
						code: "MCQ_NOT_FOUND",
						message: "Question not found.",
					},
				},
				{ status: 404 },
			);
		}

		return NextResponse.json({ data });
	} catch (error) {
		return handleMcqRouteError(error);
	}
}

export async function PUT(request: Request, context: RouteContext) {
	const auth = await requireApiAuth();

	if (auth instanceof NextResponse) {
		return auth;
	}

	try {
		const { id } = await context.params;
		const body = (await request.json()) as CreateMcqInput;
		const data = await updateMcq(id, body);

		return NextResponse.json({ data });
	} catch (error) {
		return handleMcqRouteError(error);
	}
}

export async function DELETE(_request: Request, context: RouteContext) {
	const auth = await requireApiAuth();

	if (auth instanceof NextResponse) {
		return auth;
	}

	try {
		const { id } = await context.params;
		await deleteMcq(id);

		return new NextResponse(null, { status: 204 });
	} catch (error) {
		return handleMcqRouteError(error);
	}
}
