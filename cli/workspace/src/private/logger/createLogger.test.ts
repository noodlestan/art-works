import { createGenericOperation } from '@art-lib/operations';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createLogger, parseOutputMode } from './createLogger.js';

afterEach(() => {
	vi.restoreAllMocks();
});

describe('parseOutputMode', () => {
	it('WHEN the argv value is quiet it returns quiet', () => {
		expect(parseOutputMode('quiet')).toBe('quiet');
	});

	it('WHEN the argv value is verbose it returns verbose', () => {
		expect(parseOutputMode('verbose')).toBe('verbose');
	});

	it('WHEN the argv value is absent it defaults to normal', () => {
		expect(parseOutputMode()).toBe('normal');
	});

	it('WHEN the argv value is unknown it falls back to normal', () => {
		expect(parseOutputMode('loud')).toBe('normal');
	});
});

describe('createLogger', () => {
	it('WHEN the mode is normal it prints pending operations', () => {
		const info = vi.spyOn(console, 'info').mockImplementation(() => {});
		const logger = createLogger();

		logger.log(createGenericOperation('boot'));
		logger.setOutputMode('normal');

		expect(info).toHaveBeenCalledTimes(1);
		expect(info.mock.calls[0]?.[0]).toContain('boot');
	});

	it('WHEN the mode is quiet it drops pending operations', () => {
		const info = vi.spyOn(console, 'info').mockImplementation(() => {});
		const logger = createLogger();

		logger.log(createGenericOperation('boot'));
		logger.setOutputMode('quiet');

		expect(info).not.toHaveBeenCalled();
	});
});
