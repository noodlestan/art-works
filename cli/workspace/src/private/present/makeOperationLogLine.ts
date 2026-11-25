import type { Operation } from '../operations/types.js';

import { readCheckout } from './private/readCheckout.js';
import { truncateMiddle } from './private/truncateMiddle.js';

export function makeOperationLogFields(op: Operation): string[] {
	const checkout = readCheckout(op.data);
	const repo = checkout?.repo?.name ?? (checkout ? 'WORKSPACE' : '-');
	const location = checkout?.record.location ?? '-';

	return [repo, location, op.operation, truncateMiddle(op.text(), 50)];
}

export function makeOperationLogLine(
	op: Operation,
	options: { standalone?: boolean } = {},
): string[] {
	const timing = options.standalone ? `(${op.timing()}ms)` : String(op.timing());
	const symbol = op.outcome === 'pending' ? '⏳' : op.outcome === 'success' ? '🟢' : '🔴';

	return [symbol, ...makeOperationLogFields(op), op.finishedTs ? timing : ''];
}
