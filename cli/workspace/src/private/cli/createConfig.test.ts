import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { makeTempDir } from '../../test/helpers/tempDirs/makeTempDir.js';
import { removeTempDirs } from '../../test/helpers/tempDirs/removeTempDirs.js';
import type { LoggerAPI as Logger } from '../logger/createLogger.js';

import { createConfig } from './createConfig.js';

const MANIFEST_FILE = '.art-workspace.mts';

const tempDirs: string[] = [];
const logger: Logger = { log: vi.fn(), setOutputMode: vi.fn() };

function writeManifest(dir: string, checkoutsPath: string): void {
	const config = JSON.stringify({ checkouts: { path: checkoutsPath } });

	writeFileSync(join(dir, MANIFEST_FILE), `export default ${config}`);
}

beforeEach(() => {
	vi.spyOn(console, 'info').mockImplementation(() => {});
	vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(async () => {
	await removeTempDirs(tempDirs);
	vi.restoreAllMocks();
});

describe('createConfig', () => {
	it('WHEN the manifest is in the cwd it loads the config from the cwd', async () => {
		const root = makeTempDir(tempDirs);
		writeManifest(root, 'manifest-checkouts');

		const config = await createConfig(logger, root);

		expect(config.root.path).toBe(root);
		expect(config.checkouts.path).toBe('manifest-checkouts');
		expect(vi.mocked(console.info)).toHaveBeenCalledWith(
			`Running from config at ${join(root, MANIFEST_FILE)}`,
		);
	});

	it('WHEN the manifest is in a parent dir it walks up and loads the config from the parent', async () => {
		const parent = makeTempDir(tempDirs);
		const child = join(parent, 'packages', 'app');
		mkdirSync(child, { recursive: true });
		writeManifest(parent, 'manifest-checkouts');

		const config = await createConfig(logger, child);

		expect(config.root.path).toBe(parent);
		expect(config.checkouts.path).toBe('manifest-checkouts');
		expect(config.data.store.basePath).toBe(resolve(parent, '_records/'));
		expect(vi.mocked(console.info)).toHaveBeenCalledWith(
			`Running from config at ${join(parent, MANIFEST_FILE)}`,
		);
	});

	it('WHEN no manifest exists in the cwd or any parent it falls back to the defaults', async () => {
		const root = makeTempDir(tempDirs);

		const config = await createConfig(logger, root);

		expect(config.root.path).toBe(root);
		expect(config.checkouts.path).toBe('checkouts');
		expect(config.data.template).toBe('.agents/domains/workspace/templates/checkout.art.njk');
		expect(vi.mocked(console.info)).toHaveBeenCalledWith('running without config');
		expect(vi.mocked(console.warn)).toHaveBeenCalledWith(
			expect.stringContaining(`${MANIFEST_FILE} not found at ${root}`),
		);
	});
});
