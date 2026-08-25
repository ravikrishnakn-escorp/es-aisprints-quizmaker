type FieldAccessibility = {
	errorId: string;
	inputProps: {
		"aria-invalid"?: true;
		"aria-describedby"?: string;
	};
};

export function getFieldAccessibility(
	fieldErrors: Record<string, string[]> | undefined,
	fieldName: string,
): FieldAccessibility {
	const hasError = Boolean(fieldErrors?.[fieldName]?.length);
	const errorId = `${fieldName}-error`;

	return {
		errorId,
		inputProps: hasError
			? {
					"aria-invalid": true,
					"aria-describedby": errorId,
				}
			: {},
	};
}
