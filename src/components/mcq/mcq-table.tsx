"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical } from "lucide-react";

import { DeleteMcqDialog } from "@/components/mcq/delete-mcq-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteMcqRequest, fetchMcqs } from "@/lib/api/mcq-client";
import type { McqListItem } from "@/lib/services/mcq";
import { cn } from "@/lib/utils";

type McqTableProps = {
	initialMcqs: McqListItem[];
};

type McqRowActionsProps = {
	mcq: McqListItem;
	onEdit: (mcqId: string) => void;
	onDelete: (mcq: McqListItem) => void;
};

function truncateText(text: string, maxLength = 80): string {
	if (text.length <= maxLength) {
		return text;
	}

	return `${text.slice(0, maxLength)}...`;
}

function McqRowActions({ mcq, onEdit, onDelete }: McqRowActionsProps) {
	const [open, setOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) {
			return;
		}

		function handlePointerDown(event: MouseEvent) {
			if (!menuRef.current?.contains(event.target as Node)) {
				setOpen(false);
			}
		}

		document.addEventListener("mousedown", handlePointerDown);
		return () => document.removeEventListener("mousedown", handlePointerDown);
	}, [open]);

	return (
		<div ref={menuRef} className="relative inline-block text-left">
			<button
				type="button"
				aria-label={`Actions for ${mcq.name}`}
				aria-haspopup="menu"
				aria-expanded={open}
				onClick={() => setOpen((current) => !current)}
				className={cn(
					"inline-flex size-8 items-center justify-center rounded-lg border border-transparent text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
				)}
			>
				<MoreVertical className="size-4" />
			</button>
			{open ? (
				<div
					role="menu"
					className="absolute right-0 z-50 mt-1 min-w-32 rounded-lg border border-border bg-popover p-1 text-sm shadow-md"
				>
					<button
						type="button"
						role="menuitem"
						className="block w-full rounded-md px-2 py-1.5 text-left hover:bg-muted"
						onClick={() => {
							setOpen(false);
							onEdit(mcq.id);
						}}
					>
						Edit
					</button>
					<button
						type="button"
						role="menuitem"
						className="block w-full rounded-md px-2 py-1.5 text-left text-destructive hover:bg-destructive/10"
						onClick={() => {
							setOpen(false);
							onDelete(mcq);
						}}
					>
						Delete
					</button>
				</div>
			) : null}
		</div>
	);
}

export function McqTable({ initialMcqs }: McqTableProps) {
	const router = useRouter();
	const [mcqs, setMcqs] = useState<McqListItem[]>(initialMcqs);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<McqListItem | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const loadMcqs = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			const result = await fetchMcqs();
			setMcqs(result.data);
		} catch (loadError) {
			setError(loadError instanceof Error ? loadError.message : "Failed to load questions.");
		} finally {
			setIsLoading(false);
		}
	}, []);

	async function handleDeleteConfirm() {
		if (!deleteTarget) {
			return;
		}

		setIsDeleting(true);

		try {
			await deleteMcqRequest(deleteTarget.id);
			setDeleteTarget(null);
			await loadMcqs();
			router.refresh();
		} catch (deleteError) {
			setError(deleteError instanceof Error ? deleteError.message : "Failed to delete question.");
			setDeleteTarget(null);
		} finally {
			setIsDeleting(false);
		}
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 className="text-lg font-medium">Questions</h2>
					<p className="text-sm text-muted-foreground">Manage your multiple-choice questions.</p>
				</div>
				<Link href="/dashboard/questions/new" className={buttonVariants()}>
					Create New Question
				</Link>
			</div>

			{error ? (
				<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
					<p>{error}</p>
					<Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => void loadMcqs()}>
						Retry
					</Button>
				</div>
			) : null}

			{isLoading ? (
				<p className="text-sm text-muted-foreground">Loading questions...</p>
			) : mcqs.length === 0 ? (
				<div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
					<p className="text-sm text-muted-foreground">No questions yet. Create your first question.</p>
				</div>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Question Name</TableHead>
							<TableHead>Question Text</TableHead>
							<TableHead className="w-16 text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{mcqs.map((mcq) => (
							<TableRow key={mcq.id}>
								<TableCell className="font-medium">{mcq.name}</TableCell>
								<TableCell className="max-w-md whitespace-normal">{truncateText(mcq.question)}</TableCell>
								<TableCell className="text-right">
									<McqRowActions
										mcq={mcq}
										onEdit={(mcqId) => router.push(`/dashboard/questions/${mcqId}/edit`)}
										onDelete={setDeleteTarget}
									/>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}

			<DeleteMcqDialog
				open={Boolean(deleteTarget)}
				mcqName={deleteTarget?.name ?? ""}
				isDeleting={isDeleting}
				onOpenChange={(open) => {
					if (!open) {
						setDeleteTarget(null);
					}
				}}
				onConfirm={() => void handleDeleteConfirm()}
			/>
		</div>
	);
}
