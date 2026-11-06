import type { OperationPending as SharedOperationPending } from '@art-lib/operations/model';

import type { OperationPending } from './types.js';

/**
 * Adapts a CLI pending operation to the shared `@art-lib/operations` contract:
 * the `Date` timestamp becomes epoch milliseconds, `message`/`text`/`timing`
 * satisfy the shared `Message` shape, and `level` is the shared pending level —
 * the shared factories derive their own level and never read this one back.
 */
export function toSharedPending(pending: OperationPending): SharedOperationPending {
	return {
		operation: pending.operation,
		ts: pending.ts.getTime(),
		outcome: pending.outcome,
		level: 'debug',
		data: pending.data,
		message: pending.message,
		timing: pending.timing,
		text: pending.message,
	};
}
