import { Command } from 'commander';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { makeTempDir } from '../../test/helpers/tempDirs/makeTempDir.js';
import { removeTempDirs } from '../../test/helpers/tempDirs/removeTempDirs.js';

const tempDirs: string[] = [];

/** The boot operation lines printed so far — one per `setOutputMode` flush. */
function bootLines(): unknown[] {
	return vi
		.mocked(console.info)
		.mock.calls.map(call => call[0])
		.filter(line => String(line).includes('boot'));
}

afterEach(async () => {
	await removeTempDirs(tempDirs);
	vi.restoreAllMocks();
});

describe('createCommandContext', () => {
	it('WHEN no mode is given it defaults to normal and prints the boot operation', async () => {
		vi.spyOn(console, 'info').mockImplementation(() => {});
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		const root = makeTempDir(tempDirs);
		vi.resetModules();
		const { createCommandContext } = await import('./createCommandContext.js');

		const ctx = await createCommandContext(root, new Command());

		expect(ctx.config.root.path).toBe(root);
		expect(bootLines()).toHaveLength(1);
	});

	it('WHEN quiet is given it drops the boot operation', async () => {
		vi.spyOn(console, 'info').mockImplementation(() => {});
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		const root = makeTempDir(tempDirs);
		vi.resetModules();
		const { createCommandContext } = await import('./createCommandContext.js');

		await createCommandContext(root, new Command(), 'quiet');

		expect(bootLines()).toHaveLength(0);
	});

	it('WHEN verbose is given it prints the boot operation', async () => {
		vi.spyOn(console, 'info').mockImplementation(() => {});
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		const root = makeTempDir(tempDirs);
		vi.resetModules();
		const { createCommandContext } = await import('./createCommandContext.js');

		await createCommandContext(root, new Command(), 'verbose');

		expect(bootLines()).toHaveLength(1);
	});
});
