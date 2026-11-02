import { createHash } from 'node:crypto';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { compileConfig } from '@art-lib/config';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { makeConfigCachePaths } from '../test/helpers/config/makeConfigCachePaths.js';
import { makeTempDir } from '../test/helpers/tempDirs/makeTempDir.js';
import { removeTempDirs } from '../test/helpers/tempDirs/removeTempDirs.js';

import type { ConfigCacheMeta } from './types.js';

import { loadWorkspaceConfig } from './index.js';

// The esbuild bundle-at-runtime pipeline now runs inside `@art-lib/config`; spy on its
// `compileConfig` entry point to count rebuilds — externalized package code cannot see
// an `esbuild` mock declared here.
vi.mock('@art-lib/config', async importOriginal => {
	const actual = await importOriginal<typeof import('@art-lib/config')>();

	return {
		...actual,
		compileConfig: vi.fn(actual.compileConfig),
	};
});

const compileMock = vi.mocked(compileConfig);

const SOME_CONFIG = JSON.stringify({
	root: { path: 'root-path' },
	checkouts: { path: 'checkouts-path' },
	data: { store: { basePath: 'store-path', patterns: [] }, template: 'checkouts-template' },
	discover: { records: { paths: [{ base: '.', pattern: '*.art' }] } },
});

const CHANGED_CONFIG = JSON.stringify({
	root: { path: 'root-path' },
	checkouts: { path: 'changed-checkouts-path' },
	data: { store: { basePath: 'store-path', patterns: [] }, template: 'checkouts-template' },
	discover: { records: { paths: [{ base: '.', pattern: '*.art' }] } },
});

const tempDirs: string[] = [];

function readCacheMeta(tempDir: string): ConfigCacheMeta {
	const { metaPath } = makeConfigCachePaths(tempDir);
	return JSON.parse(readFileSync(metaPath, 'utf8'));
}

function sha256(content: string): string {
	return createHash('sha256').update(content).digest('hex');
}

beforeEach(() => {
	compileMock.mockClear();
	vi.spyOn(console, 'info').mockImplementation(() => {});
	vi.spyOn(console, 'warn').mockImplementation(() => {});
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(async () => {
	await removeTempDirs(tempDirs);
	vi.restoreAllMocks();
});

describe('loadWorkspaceConfig', () => {
	it('WHEN the config is missing it loads the default config', async () => {
		const tempDir = makeTempDir(tempDirs);

		const config = await loadWorkspaceConfig(tempDir);

		expect(config.checkouts.path).toBe('checkouts');
		expect(config.data.store.basePath).toBe(resolve(tempDir, '_records/'));
		expect(config.data.template).toBe('.agents/domains/workspace/templates/checkout.art.njk');
		expect(config.discover.records.paths[0].pattern).toBe('*.art');
	});

	it('WHEN the config is missing it warns and still returns a config', async () => {
		const tempDir = makeTempDir(tempDirs);
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

		const config = await loadWorkspaceConfig(tempDir);

		expect(warnSpy).toHaveBeenCalled();
		expect(config.checkouts.path).toBe('checkouts');
		expect(config.discover.records.paths[0].pattern).toBe('*.art');
	});

	it('WHEN the config is present it returns the loaded config', async () => {
		const tempDir = makeTempDir(tempDirs);
		writeFileSync(join(tempDir, '.art-workspace.mts'), `export default ${SOME_CONFIG}`);

		const config = await loadWorkspaceConfig(tempDir);

		expect(config.root.path).toBe(tempDir);
		expect(config.checkouts.path).toBe('checkouts-path');
		expect(config.data.template).toBe('checkouts-template');
		expect(config.discover.records.paths[0].pattern).toBe('*.art');
	});

	it('GIVEN a successful load it writes the bundle into the cache and skips the root-level file', async () => {
		const tempDir = makeTempDir(tempDirs);
		const { bundlePath } = makeConfigCachePaths(tempDir);
		writeFileSync(join(tempDir, '.art-workspace.mts'), `export default ${SOME_CONFIG}`);

		await loadWorkspaceConfig(tempDir);

		expect(existsSync(bundlePath)).toBe(true);
		expect(existsSync(join(tempDir, '.art-workspace-bundle.mjs'))).toBe(false);
	});

	it('GIVEN a legacy root-level bundle exists a load removes it', async () => {
		const tempDir = makeTempDir(tempDirs);
		writeFileSync(join(tempDir, '.art-workspace.mts'), `export default ${SOME_CONFIG}`);
		const legacyBundlePath = join(tempDir, '.art-workspace-bundle.mjs');
		writeFileSync(legacyBundlePath, 'export default {};');

		await loadWorkspaceConfig(tempDir);

		expect(existsSync(legacyBundlePath)).toBe(false);
	});

	it('WHEN the cache directory cannot be created it warns and still returns a config', async () => {
		const tempDir = makeTempDir(tempDirs);
		const { cacheDir } = makeConfigCachePaths(tempDir);
		writeFileSync(join(tempDir, '.art-workspace.mts'), `export default ${SOME_CONFIG}`);
		writeFileSync(join(tempDir, 'node_modules'), 'not-a-directory');
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

		const config = await loadWorkspaceConfig(tempDir);

		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining(cacheDir));
		expect(config.checkouts.path).toBe('checkouts-path');
		expect(config.discover.records.paths[0].pattern).toBe('*.art');
	});

	it('WHEN the manifest throws on import it reports the manifest path', async () => {
		const tempDir = makeTempDir(tempDirs);
		writeFileSync(join(tempDir, '.art-workspace.mts'), "throw new Error('boom');\n");

		await expect(loadWorkspaceConfig(tempDir)).rejects.toThrow(/\.art-workspace\.mts/);
	});

	it('WHEN the manifest fails to bundle it reports the manifest path', async () => {
		const tempDir = makeTempDir(tempDirs);
		writeFileSync(join(tempDir, '.art-workspace.mts'), 'export default {{{');

		await expect(loadWorkspaceConfig(tempDir)).rejects.toThrow(/\.art-workspace\.mts/);
	});

	it('GIVEN a successful load it records a sha256 for every bundled input', async () => {
		const tempDir = makeTempDir(tempDirs);
		const manifestPath = join(tempDir, '.art-workspace.mts');
		writeFileSync(manifestPath, `export default ${SOME_CONFIG}`);

		await loadWorkspaceConfig(tempDir);

		const cacheMeta = readCacheMeta(tempDir);

		expect(cacheMeta.version).toBe(1);
		expect(cacheMeta.manifest).toBe(manifestPath);
		expect(cacheMeta.inputs).toEqual([
			{ path: '.art-workspace.mts', hash: sha256(readFileSync(manifestPath, 'utf8')) },
		]);
	});

	it('GIVEN a valid cache a second load reuses the bundle without building', async () => {
		const tempDir = makeTempDir(tempDirs);
		writeFileSync(join(tempDir, '.art-workspace.mts'), `export default ${SOME_CONFIG}`);

		await loadWorkspaceConfig(tempDir);

		const config = await loadWorkspaceConfig(tempDir);

		expect(compileMock).toHaveBeenCalledTimes(1);
		expect(vi.mocked(console.info)).not.toHaveBeenCalledWith('⚙️ [config] reused cached bundle');

		await loadWorkspaceConfig(tempDir, { verbose: true });

		expect(vi.mocked(console.info)).toHaveBeenCalledWith('⚙️ [config] reused cached bundle');
		expect(config.checkouts.path).toBe('checkouts-path');
	});

	it('GIVEN the manifest changed a load rebuilds and rewrites the cache metadata', async () => {
		const tempDir = makeTempDir(tempDirs);
		const manifestPath = join(tempDir, '.art-workspace.mts');
		writeFileSync(manifestPath, `export default ${SOME_CONFIG}`);

		await loadWorkspaceConfig(tempDir);

		compileMock.mockClear();
		writeFileSync(manifestPath, `export default ${CHANGED_CONFIG}`);

		await loadWorkspaceConfig(tempDir);

		expect(compileMock).toHaveBeenCalledTimes(1);
		expect(readCacheMeta(tempDir).inputs).toEqual([
			{ path: '.art-workspace.mts', hash: sha256(readFileSync(manifestPath, 'utf8')) },
		]);
	});

	it('GIVEN a file imported by the manifest changed a load rebuilds', async () => {
		const tempDir = makeTempDir(tempDirs);
		const manifestPath = join(tempDir, '.art-workspace.mts');
		const settingsPath = join(tempDir, 'settings.mts');
		writeFileSync(settingsPath, "export const clonePath = 'first-clone';\n");
		const config = [
			"import { clonePath } from './settings.mts';",
			'',
			'export default {',
			'	clone: { path: clonePath },',
			'	root: {},',
			"	checkouts: { path: 'checkouts-path', template: 'checkouts-template' },",
			"	records: { pattern: '*.art' },",
			'};',
			'',
		].join('\n');
		writeFileSync(manifestPath, config);

		await loadWorkspaceConfig(tempDir);

		compileMock.mockClear();
		writeFileSync(settingsPath, "export const clonePath = 'second-clone';\n");

		await loadWorkspaceConfig(tempDir);

		expect(compileMock).toHaveBeenCalledTimes(1);
		expect(readCacheMeta(tempDir).inputs).toEqual(
			expect.arrayContaining([
				{ path: 'settings.mts', hash: sha256(readFileSync(settingsPath, 'utf8')) },
			]),
		);
	});

	it('GIVEN the bundle is missing a load rebuilds', async () => {
		const tempDir = makeTempDir(tempDirs);
		const { bundlePath } = makeConfigCachePaths(tempDir);
		writeFileSync(join(tempDir, '.art-workspace.mts'), `export default ${SOME_CONFIG}`);

		await loadWorkspaceConfig(tempDir);

		rmSync(bundlePath);
		compileMock.mockClear();

		await loadWorkspaceConfig(tempDir);

		expect(compileMock).toHaveBeenCalledTimes(1);
		expect(existsSync(bundlePath)).toBe(true);
	});

	it('GIVEN the cache metadata is missing a load rebuilds', async () => {
		const tempDir = makeTempDir(tempDirs);
		const { metaPath } = makeConfigCachePaths(tempDir);
		writeFileSync(join(tempDir, '.art-workspace.mts'), `export default ${SOME_CONFIG}`);

		await loadWorkspaceConfig(tempDir);

		rmSync(metaPath);
		compileMock.mockClear();

		await loadWorkspaceConfig(tempDir);

		expect(compileMock).toHaveBeenCalledTimes(1);
		expect(existsSync(metaPath)).toBe(true);
	});

	it('GIVEN the cache metadata is unparseable a load rebuilds', async () => {
		const tempDir = makeTempDir(tempDirs);
		const { metaPath } = makeConfigCachePaths(tempDir);
		writeFileSync(join(tempDir, '.art-workspace.mts'), `export default ${SOME_CONFIG}`);

		await loadWorkspaceConfig(tempDir);

		writeFileSync(metaPath, '{not-json');
		compileMock.mockClear();

		await loadWorkspaceConfig(tempDir);

		expect(compileMock).toHaveBeenCalledTimes(1);
	});

	it('GIVEN the cache metadata version mismatches a load rebuilds', async () => {
		const tempDir = makeTempDir(tempDirs);
		const { metaPath } = makeConfigCachePaths(tempDir);
		writeFileSync(join(tempDir, '.art-workspace.mts'), `export default ${SOME_CONFIG}`);

		await loadWorkspaceConfig(tempDir);

		const cacheMeta = readCacheMeta(tempDir);
		const config = JSON.stringify({ ...cacheMeta, version: 2 });
		writeFileSync(metaPath, config);
		compileMock.mockClear();

		await loadWorkspaceConfig(tempDir);

		expect(compileMock).toHaveBeenCalledTimes(1);
	});

	it('GIVEN a recorded input is missing a load rebuilds', async () => {
		const tempDir = makeTempDir(tempDirs);
		const { metaPath } = makeConfigCachePaths(tempDir);
		writeFileSync(join(tempDir, '.art-workspace.mts'), `export default ${SOME_CONFIG}`);

		await loadWorkspaceConfig(tempDir);

		const cacheMeta = readCacheMeta(tempDir);
		const ghostInput = { path: 'ghost.mts', hash: 'deadbeef' };
		const config = JSON.stringify({ ...cacheMeta, inputs: [...cacheMeta.inputs, ghostInput] });
		writeFileSync(metaPath, config);
		compileMock.mockClear();

		await loadWorkspaceConfig(tempDir);

		expect(compileMock).toHaveBeenCalledTimes(1);
	});

	it('GIVEN a valid cache the default honours it and a cache false call rebuilds', async () => {
		const tempDir = makeTempDir(tempDirs);
		writeFileSync(join(tempDir, '.art-workspace.mts'), `export default ${SOME_CONFIG}`);

		await loadWorkspaceConfig(tempDir);

		compileMock.mockClear();
		const reused = await loadWorkspaceConfig(tempDir);

		expect(compileMock).not.toHaveBeenCalled();
		expect(reused.checkouts.path).toBe('checkouts-path');

		const rebuilt = await loadWorkspaceConfig(tempDir, { cache: false });

		expect(compileMock).toHaveBeenCalledTimes(1);
		expect(rebuilt.checkouts.path).toBe('checkouts-path');
		expect(vi.mocked(console.info)).toHaveBeenCalledWith(
			'⚙️ [config] cache bypassed, rebuilt bundle',
		);
	});

	it('GIVEN the cache option is false a load refreshes the cache metadata', async () => {
		const tempDir = makeTempDir(tempDirs);
		const { metaPath } = makeConfigCachePaths(tempDir);
		const manifestPath = join(tempDir, '.art-workspace.mts');
		writeFileSync(manifestPath, `export default ${SOME_CONFIG}`);

		await loadWorkspaceConfig(tempDir);

		const staleMeta = {
			...readCacheMeta(tempDir),
			inputs: [{ path: '.art-workspace.mts', hash: 'deadbeef' }],
		};
		writeFileSync(metaPath, JSON.stringify(staleMeta));
		compileMock.mockClear();

		await loadWorkspaceConfig(tempDir, { cache: false });

		expect(compileMock).toHaveBeenCalledTimes(1);
		expect(readCacheMeta(tempDir).inputs).toEqual([
			{ path: '.art-workspace.mts', hash: sha256(readFileSync(manifestPath, 'utf8')) },
		]);
	});
});
