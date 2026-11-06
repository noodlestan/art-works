import { createGenericOperation as createSharedGenericOperation } from '@art-lib/operations/model';

import type { OperationPending } from './types.js';

function formatData(data: unknown): string {
	return data ? JSON.stringify(data) : '';
}

export function createGenericOperation(operation: string, data?: unknown): OperationPending {
	const shared = createSharedGenericOperation(operation, data);

	return {
		ts: new Date(shared.ts),
		outcome: shared.outcome,
		operation: shared.operation,
		data: shared.data,
		message() {
			return formatData(data);
		},
		timing: shared.timing,
	};
}
