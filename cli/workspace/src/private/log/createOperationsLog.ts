import {
	type LoggableOperation,
	createOperationsLog as createSharedOperationsLog,
} from '@art-lib/operations/log';

import type { Operation } from '../operations/types.js';

export interface OperationsLog {
	log(operation: Operation): void;
	all(): Operation[];
	since(ts: Date): Operation[];
	latest(n: number): Operation[];
}

/**
 * The shared log only reads `outcome` and forwards operations to the logger,
 * so CLI operations — with their `Date` timestamps — satisfy its contract at
 * runtime; the cast restores the CLI view on the way out.
 */
function asLoggable(operation: Operation): LoggableOperation {
	return operation as unknown as LoggableOperation;
}

export function createOperationsLog(logger: (op: Operation) => void = () => {}): OperationsLog {
	const shared = createSharedOperationsLog({
		log(message): void {
			logger(message as unknown as Operation);
		},
		setOutputMode(): void {
			// no-op: the operations log does not switch output modes
		},
	});

	function all(): Operation[] {
		return shared.all() as unknown as Operation[];
	}

	return {
		log(operation: Operation): void {
			shared.log(asLoggable(operation));
		},
		all,
		since(ts: Date): Operation[] {
			return all().filter(op => op.ts > ts);
		},
		latest(n: number): Operation[] {
			return all().slice(-n);
		},
	};
}
