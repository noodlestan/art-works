import { createOperationFailure as createSharedOperationFailure } from '@art-lib/operations/model';

import { toSharedPending } from './toSharedPending.js';
import type { OperationFailure, OperationPending } from './types.js';

function formatRawError(raw: string): string {
	const lines = raw
		.split('\n')
		.map(l => l.trim())
		.filter(l => l.length > 0);
	return lines.map(l => '  ' + l).join('\n');
}

function extractReason(raw: string): string {
	const match = raw.match(/\(([^)]+)\)/);
	return match ? match[1] : (raw.split('\n')[0]?.trim() ?? 'unknown error');
}

const errorLabels: Record<string, string> = {
	clone: 'CloneError',
	push: 'PushError',
	pull: 'PullError',
	publish: 'PublishError',
	branch: 'BranchError',
	linked: 'LinkedError',
	unlink: 'UnlinkError',
	run: 'CheckoutRunError',
};

export function createOperationFailure<T extends OperationPending>(
	pending: T,
	error: unknown,
): OperationFailure {
	const label = errorLabels[pending.operation] ?? 'OperationError';
	const shared = createSharedOperationFailure(toSharedPending(pending), error, { label });

	return {
		...pending,
		outcome: shared.outcome,
		finishedTs: new Date(shared.finishedTs ?? Date.now()),
		error: shared.error,
		timing: shared.timing,
		message() {
			return extractReason(this.error);
		},
		errorSerialized() {
			return `${label}: ${pending.checkout?.repo?.name} — ${this.message()}\n\n${formatRawError(this.error)}`;
		},
	};
}
