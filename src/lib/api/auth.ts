import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import type { PublicUser } from "@/lib/services/user";

export function unauthorizedResponse(): NextResponse {
	return NextResponse.json(
		{
			error: {
				code: "UNAUTHORIZED",
				message: "Authentication required.",
			},
		},
		{ status: 401 },
	);
}

export async function requireApiAuth(): Promise<PublicUser | NextResponse> {
	const user = await getCurrentUser();

	if (!user) {
		return unauthorizedResponse();
	}

	return user;
}
