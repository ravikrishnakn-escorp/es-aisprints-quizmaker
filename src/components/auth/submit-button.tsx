"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

type SubmitButtonProps = {
	children: React.ReactNode;
	pendingLabel: string;
};

export function SubmitButton({ children, pendingLabel }: SubmitButtonProps) {
	const { pending } = useFormStatus();

	return (
		<Button type="submit" disabled={pending} className="w-full">
			{pending ? pendingLabel : children}
		</Button>
	);
}
