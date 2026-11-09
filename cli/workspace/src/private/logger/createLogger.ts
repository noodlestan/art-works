import { createLogger as createBufferingLogger } from '@art-lib/logger';
import type { LogFormatter, LogWriter, Message, MessageLevel, OutputMode } from '@art-lib/logger';
import type { OperationOutcome } from '@art-lib/operations';

import type { Operation } from '../operations/types.js';
import { makeOperationLogLine } from '../present/makeOperationLogLine.js';

export interface LoggerAPI {
	log(op: Operation): void;
	setOutputMode(mode: OutputMode): void;
}

/** A `Message` carrying the operation its log line is rendered from. */
type OperationMessage = Message & { op: Operation };

/**
 * `quiet` writes `warning` and `error` only — the CLI's finished work. Pending
 * operations map to `info` so `quiet` keeps dropping them, exactly as before.
 */
function levelOf(outcome: OperationOutcome): MessageLevel {
	if (outcome === 'pending') {
		return 'info';
	}

	return outcome === 'success' ? 'warning' : 'error';
}

const operationLogFormatter: LogFormatter = {
	format(message: Message): string[] {
		const { op } = message as OperationMessage;

		return [makeOperationLogLine(op, { standalone: true }).join(' | ')];
	},
};

const stdoutLogWriter: LogWriter = {
	write(lines: string[]): void {
		for (const line of lines) {
			console.info(line);
		}
	},
};

function toMessage(op: Operation): OperationMessage {
	return {
		level: levelOf(op.outcome),
		text: () => op.text(),
		ts: op.ts,
		op,
	};
}

/**
 * Converts the raw `-o` argv string once, at the commander boundary: the rest
 * of the CLI only ever sees an `OutputMode`. Anything but `quiet` or `verbose`
 * falls back to `normal`.
 */
export function parseOutputMode(value?: string): OutputMode {
	return value === 'quiet' || value === 'verbose' ? value : 'normal';
}

export function createLogger(): LoggerAPI {
	const logger = createBufferingLogger({
		formatter: operationLogFormatter,
		writer: stdoutLogWriter,
	});

	return {
		log(op: Operation): void {
			logger.log(toMessage(op));
		},
		setOutputMode(mode: OutputMode): void {
			logger.setOutputMode(mode);
		},
	};
}
