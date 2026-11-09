import type { Operation } from '../operations/types.js';

import { readCheckout } from './private/readCheckout.js';
import { truncateMiddle } from './private/truncateMiddle.js';

export function makeOperationLogLine(
	op: Operation,
	options: { standalone?: boolean } = {},
): string[] {
	const { standalone } = options;

	const timing = standalone ? `(${op.timing()}ms)` : String(op.timing());

	const checkout = readCheckout(op.data);
	const repo = checkout?.repo?.name ?? (checkout ? 'WORKSPACE' : '-');
	const location = checkout?.record.location ?? '-';

	return [
		op.outcome === 'pending' ? '⏳' : op.outcome === 'success' ? '🟢' : '🔴',
		repo,
		location,
		op.operation,
		truncateMiddle(op.text(), 50),
		op.finishedTs ? timing : '',
	];
}
