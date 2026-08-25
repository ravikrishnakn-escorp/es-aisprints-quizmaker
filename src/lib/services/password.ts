const SALT_LENGTH = 16;
const ITERATIONS = 100_000;
const KEY_LENGTH = 32;
const HASH_ALGORITHM = "SHA-256";

function bytesToHex(bytes: Uint8Array): string {
	return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string): Uint8Array {
	const bytes = new Uint8Array(hex.length / 2);

	for (let index = 0; index < bytes.length; index += 1) {
		bytes[index] = parseInt(hex.slice(index * 2, index * 2 + 2), 16);
	}

	return bytes;
}

async function deriveKey(password: string, salt: Uint8Array): Promise<Uint8Array> {
	const encoder = new TextEncoder();
	const saltBuffer = new Uint8Array(salt);
	const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
	const derivedBits = await crypto.subtle.deriveBits(
		{
			name: "PBKDF2",
			salt: saltBuffer,
			iterations: ITERATIONS,
			hash: HASH_ALGORITHM,
		},
		keyMaterial,
		KEY_LENGTH * 8,
	);

	return new Uint8Array(derivedBits);
}

function timingSafeEqual(left: string, right: string): boolean {
	if (left.length !== right.length) {
		return false;
	}

	let mismatch = 0;

	for (let index = 0; index < left.length; index += 1) {
		mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
	}

	return mismatch === 0;
}

export async function hashPassword(password: string): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
	const hash = await deriveKey(password, salt);

	return `${bytesToHex(salt)}:${bytesToHex(hash)}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
	const [saltHex, hashHex] = storedHash.split(":");

	if (!saltHex || !hashHex) {
		return false;
	}

	const salt = hexToBytes(saltHex);
	const hash = await deriveKey(password, salt);

	return timingSafeEqual(bytesToHex(hash), hashHex);
}
