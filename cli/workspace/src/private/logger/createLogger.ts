import { createLogger as createAtLibLogger } from '@art-lib/logger';
import type { LogWriter, LoggerAPI } from '@art-lib/logger';

const stdoutLogWriter: LogWriter = message => {
	process.stdout.write(`${message.text}\n`);
};

export function createLogger(): LoggerAPI {
	return createAtLibLogger({ writer: stdoutLogWriter });
}
