import type { LoggerAPI } from '@art-lib/logger';
import {
	type OperationsLog,
	createOperationsLog as createSharedOperationsLog,
} from '@art-lib/operations';

/**
 * art-works ships no logger test util and the shared `createLoggerMock` is not
 * exported, so the delegate falls back to a silent logger.
 */
const silentLogger: LoggerAPI = {
	log(): void {},
	setOutputMode(): void {},
};

export type { OperationsLog };

export function createOperationsLog(logger: LoggerAPI = silentLogger): OperationsLog {
	return createSharedOperationsLog(logger);
}
