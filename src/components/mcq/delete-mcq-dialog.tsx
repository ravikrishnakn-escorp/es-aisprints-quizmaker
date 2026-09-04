"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

type DeleteMcqDialogProps = {
	open: boolean;
	mcqName: string;
	isDeleting: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
};

export function DeleteMcqDialog({ open, mcqName, isDeleting, onOpenChange, onConfirm }: DeleteMcqDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent showCloseButton={!isDeleting}>
				<DialogHeader>
					<DialogTitle>Delete question?</DialogTitle>
					<DialogDescription>
						This will permanently delete &quot;{mcqName}&quot; and all of its choices. This action cannot be
						undone.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button type="button" variant="outline" disabled={isDeleting} onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button type="button" variant="destructive" disabled={isDeleting} onClick={onConfirm}>
						{isDeleting ? "Deleting..." : "Delete"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
