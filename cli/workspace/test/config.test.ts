import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import type { ConfigCacheMeta } from '../src/config/types.js';
import { removeTempDirs } from '../src/test/helpers/tempDirs/removeTempDirs.js';

import { setupWorkspace } from './helpers/setupWorkspace.js';
import { spawnCli } from './helpers/spawnCli.js';
import { type TestCliResult } from './helpers/types.js';

const CACHE_DIR_SEGMENTS = ['node_modules', '.art-workspace'];
const MANIFEST_FILE = '.art-workspace.mts';

const tempDirs: string[] = [];
const cacheDirs: string[] = [];

function resolveCacheDir(root: string): string {
	return join(root, ...CACHE_DIR_SEGMENTS);
}

function trackConfigCacheDir(root: string): void {
	cacheDirs.push(resolveCacheDir(root));
}

/** Every cache written by a run lives under its workspace root; drop them before the roots. */
async function removeConfigCacheDirs(): Promise<void> {
	const removals = cacheDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true }));
	await Promise.all(removals);
}

afterEach(async () => {
	await removeConfigCacheDirs();
	await removeTempDirs(tempDirs);
});

/** Commands report on stdout, commander errors on stderr — assertions read both. */
function output(result: TestCliResult): string {
	return result.stdout + result.stderr;
}

describe('cli config cache', () => {
	it('WHEN run repeatedly against an unchanged manifest, only -o verbose logs the cache reuse', async () => {
		const root = await setupWorkspace(tempDirs);
		trackConfigCacheDir(root);

		const firstRun = await spawnCli({ args: ['sanity'], cwd: root });
		const verboseRun = await spawnCli({ args: ['sanity', '-o', 'verbose'], cwd: root });
		const silentRun = await spawnCli({ args: ['sanity'], cwd: root });

		expect(firstRun.code).toBe(0);
		expect(output(firstRun)).not.toContain('[config] reused cached bundle');
		expect(verboseRun.code).toBe(0);
		expect(output(verboseRun)).toContain('[config] reused cached bundle');
		expect(silentRun.code).toBe(0);
		expect(output(silentRun)).not.toContain('[config] reused cached bundle');
	});

	it('WHEN the manifest is edited between runs, the next run rebuilds the bundle', async () => {
		const root = await setupWorkspace(tempDirs);
		trackConfigCacheDir(root);
		await spawnCli({ args: ['sanity'], cwd: root });

		const manifestPath = join(root, MANIFEST_FILE);
		writeFileSync(manifestPath, `${readFileSync(manifestPath, 'utf8')}\n// edited between runs\n`);

		const result = await spawnCli({ args: ['sanity'], cwd: root });

		expect(result.code).toBe(0);
		expect(output(result)).toContain('[config] rebuilt bundle');
		expect(output(result)).not.toContain('[config] reused cached bundle');
	});

	it('WHEN --no-config-cache is given, the run rebuilds and refreshes the cache', async () => {
		const root = await setupWorkspace(tempDirs);
		trackConfigCacheDir(root);
		await spawnCli({ args: ['sanity'], cwd: root });

		const metaPath = join(resolveCacheDir(root), 'config.cache.json');
		writeFileSync(metaPath, '{not-json');

		const result = await spawnCli({ args: ['sanity', '--no-config-cache'], cwd: root });

		const refreshedMeta = JSON.parse(readFileSync(metaPath, 'utf8')) as ConfigCacheMeta;

		expect(result.code).toBe(0);
		expect(output(result)).toContain('[config] cache bypassed, rebuilt bundle');
		expect(refreshedMeta.manifest).toContain(MANIFEST_FILE);
		expect(refreshedMeta.inputs).toEqual([{ path: MANIFEST_FILE, hash: expect.any(String) }]);
	});

	it('WHEN a run compiles the config, the cache lives under node_modules and never at the root', async () => {
		const root = await setupWorkspace(tempDirs);
		trackConfigCacheDir(root);

		const result = await spawnCli({ args: ['sanity'], cwd: root });

		expect(result.code).toBe(0);
		expect(existsSync(join(resolveCacheDir(root), 'config.bundle.mjs'))).toBe(true);
		expect(existsSync(join(resolveCacheDir(root), 'config.cache.json'))).toBe(true);
		expect(existsSync(join(root, 'config.bundle.mjs'))).toBe(false);
		expect(existsSync(join(root, 'config.cache.json'))).toBe(false);
		expect(existsSync(join(root, '.art-workspace-bundle.mjs'))).toBe(false);
	});

	it('WHEN run from a nested cwd, the discovered parent config feeds the shipped bundle cache', async () => {
		const root = await setupWorkspace(tempDirs);
		trackConfigCacheDir(root);
		const nested = join(root, 'packages', 'app');
		mkdirSync(nested, { recursive: true });

		const result = await spawnCli({ args: ['sanity'], cwd: nested });

		expect(result.code).toBe(0);
		expect(output(result)).not.toContain('not found at');
		expect(output(result)).toContain(
			`Running from config at ${join(realpathSync(root), MANIFEST_FILE)}`,
		);
		expect(existsSync(join(resolveCacheDir(root), 'config.bundle.mjs'))).toBe(true);
		expect(existsSync(join(nested, ...CACHE_DIR_SEGMENTS))).toBe(false);
		expect(existsSync(join(nested, '.art-workspace-bundle.mjs'))).toBe(false);
		expect(existsSync(join(root, '.art-workspace-bundle.mjs'))).toBe(false);

		const metaPath = join(resolveCacheDir(root), 'config.cache.json');
		const cacheMeta = JSON.parse(readFileSync(metaPath, 'utf8')) as ConfigCacheMeta;

		// `process.cwd()` reports the symlink-resolved temp path on macOS
		expect(cacheMeta.manifest).toBe(join(realpathSync(root), MANIFEST_FILE));
	});
});
