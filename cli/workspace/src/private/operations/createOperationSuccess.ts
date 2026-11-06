import { createOperationSuccess as createSharedOperationSuccess } from '@art-lib/operations/model';

import { toSharedPending } from './toSharedPending.js';
import type { OperationPending, OperationSuccess } from './types.js';

export function createOperationSuccess<T extends OperationPending>(
	pending: T,
	message?: string,
): OperationSuccess {
	const shared = createSharedOperationSuccess(toSharedPending(pending), message);

	return {
		...pending,
		outcome: shared.outcome,
		finishedTs: new Date(shared.finishedTs ?? Date.now()),
		message: shared.message,
		timing: shared.timing,
	};
}
