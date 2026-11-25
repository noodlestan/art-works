import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { createLogger } from './createLogger.js';

const stdoutWriteMock = vi.fn<(chunk: string) => void>();
const stdoutWriteSpy = vi.spyOn(process.stdout, 'write').mockImplementation(chunk => {
	stdoutWriteMock(String(chunk));
	return true;
});

beforeEach(() => {
	stdoutWriteMock.mockClear();
});

afterAll(() => stdoutWriteSpy.mockRestore());

describe('createLogger', () => {
	it('WHEN the mode is normal it writes logger message text to stdout', () => {
		const logger = createLogger();

		logger.log({ level: 'info', text: 'boot', ts: Date.now() });
		logger.setOutputMode('normal');

		expect(stdoutWriteMock).toHaveBeenCalledWith('boot\n');
	});

	it('WHEN the mode is quiet it filters debug messages', () => {
		const logger = createLogger();

		logger.log({ level: 'debug', text: 'boot', ts: Date.now() });
		logger.setOutputMode('quiet');

		expect(stdoutWriteMock).not.toHaveBeenCalled();
	});
});
