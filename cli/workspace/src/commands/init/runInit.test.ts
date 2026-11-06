import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { makeCommandContextMock } from '../../test/helpers/context/makeCommandContextMock.js';
import { makeTempDir } from '../../test/helpers/tempDirs/makeTempDir.js';
import { removeTempDirs } from '../../test/helpers/tempDirs/removeTempDirs.js';

import { runInit } from './runInit.js';

const MANIFEST_FILE = '.art-workspace.mts';

const tempDirs: string[] = [];

afterEach(async () => {
	vi.restoreAllMocks();
	await removeTempDirs(tempDirs);
});

describe('init command', () => {
	it('WHEN the workspace has no manifest, creates it with the default config values', async () => {
		const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
		const root = makeTempDir(tempDirs);
		const ctx = makeCommandContextMock(root);

		const created = await runInit(ctx, { root });

		const content = readFileSync(join(root, MANIFEST_FILE), 'utf8');

		expect(created).toBe(true);
		expect(existsSync(join(root, MANIFEST_FILE))).toBe(true);
		expect(content).toContain('root: { path: process.cwd() }');
		expect(content).toContain("checkouts: { path: 'checkouts' }");
		expect(content).toContain('store:');
		expect(content).toContain('discover:');
		expect(content).toContain('records:');
		expect(content).not.toContain('clone');
		expect(infoSpy).toHaveBeenCalledWith(`Created ${MANIFEST_FILE} at ${root}`);
	});

	it('WHEN the manifest already exists, keeps it and reports the refusal', async () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const root = makeTempDir(tempDirs);
		const manifestPath = join(root, MANIFEST_FILE);
		writeFileSync(manifestPath, 'export default { existing: true };');
		const ctx = makeCommandContextMock(root);

		const created = await runInit(ctx, { root });

		expect(created).toBe(false);
		expect(readFileSync(manifestPath, 'utf8')).toBe('export default { existing: true };');
		expect(warnSpy).toHaveBeenCalledWith(`${MANIFEST_FILE} already exists at ${root}`);
	});
});
