import { verifyPassword } from "@/lib/services/password";
import { findUserByEmail, toPublicUser, type PublicUser } from "@/lib/services/user";

export async function authenticateUser(email: string, password: string): Promise<PublicUser | null> {
	const user = await findUserByEmail(email);

	if (!user) {
		return null;
	}

	const isValidPassword = await verifyPassword(password, user.password_hash);

	if (!isValidPassword) {
		return null;
	}

	return toPublicUser(user);
}
