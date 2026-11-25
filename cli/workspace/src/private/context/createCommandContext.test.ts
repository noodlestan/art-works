import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { makeTempDir } from '../../test/helpers/tempDirs/makeTempDir.js';
import { removeTempDirs } from '../../test/helpers/tempDirs/removeTempDirs.js';

const tempDirs: string[] = [];
const stdoutWriteMock = vi.fn<(chunk: string) => void>();
const stdoutWriteSpy = vi.spyOn(process.stdout, 'write').mockImplementation(chunk => {
	stdoutWriteMock(String(chunk));
	return true;
});

/** The boot operation lines printed so far — one per `setOutputMode` flush. */
function bootLines(): unknown[] {
	return stdoutWriteMock.mock.calls.map(([line]) => line).filter(line => line.includes('boot'));
}

beforeEach(() => {
	stdoutWriteMock.mockClear();
	vi.spyOn(console, 'info').mockImplementation(() => {});
	vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(async () => {
	await removeTempDirs(tempDirs);
	vi.mocked(console.info).mockRestore();
	vi.mocked(console.warn).mockRestore();
});

afterAll(() => stdoutWriteSpy.mockRestore());

describe('createCommandContext', () => {
	it('WHEN no mode is given it defaults to normal and filters the pending boot operation', async () => {
		const root = makeTempDir(tempDirs);
		vi.resetModules();
		const { createCommandContext } = await import('./createCommandContext.js');

		const ctx = await createCommandContext(root, false);

		expect(ctx.config.root.path).toBe(root);
		expect(bootLines()).toHaveLength(0);
	});

	it('WHEN quiet is given it drops the boot operation', async () => {
		const root = makeTempDir(tempDirs);
		vi.resetModules();
		const { createCommandContext } = await import('./createCommandContext.js');

		await createCommandContext(root, false, 'quiet');

		expect(bootLines()).toHaveLength(0);
	});

	it('WHEN verbose is given it prints the boot operation', async () => {
		const root = makeTempDir(tempDirs);
		vi.resetModules();
		const { createCommandContext } = await import('./createCommandContext.js');

		await createCommandContext(root, false, 'verbose');

		expect(bootLines()).toHaveLength(1);
	});
});
