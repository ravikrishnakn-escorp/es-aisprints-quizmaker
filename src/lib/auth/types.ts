export type AuthFormState = {
	fieldErrors?: Record<string, string[]>;
	formError?: string;
};

export const initialAuthFormState: AuthFormState = {};
