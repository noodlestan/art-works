import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import { compileConfig, findReusableBundle, importConfigModule } from '@art-lib/config';

import { DEFAULT_RECORDS_STORE_OPTIONS } from './constants.js';
import { defineConfig } from './defineConfig.js';
import { formatError } from './private/formatError.js';
import { removeLegacyBundle } from './private/removeLegacyBundle.js';
import type { PartialWorkspaceConfig, WorkspaceConfig } from './types.js';

const MANIFEST_FILE = '.art-workspace.mts';
const CACHE_DIR_SEGMENTS = ['node_modules', '.art-workspace'] as const;
const CONFIG_EXTERNALS: string[] = ['simple-git'];

const DEFAULT_CONFIG: PartialWorkspaceConfig = {
	root: { path: process.cwd() },
	checkouts: { path: 'checkouts' },
	data: {
		store: DEFAULT_RECORDS_STORE_OPTIONS,
		template: '.agents/domains/workspace/templates/checkout.art.njk',
	},
	discover: {
		records: {
			defaults: {
				base: '.',
				pattern: '*.art',
				ignored: ['node_modules/', '.git/', 'dist/'],
				excluded: [],
				gitignore: true,
			},
		},
	},
};

type LoadWorkspaceConfigOptions = { cache?: boolean; verbose?: boolean };

export async function loadWorkspaceConfig(
	rootPath: string,
	options?: LoadWorkspaceConfigOptions,
): Promise<WorkspaceConfig> {
	const manifestPath = join(rootPath, MANIFEST_FILE);

	if (!existsSync(manifestPath)) {
		console.warn(`🟨 ${MANIFEST_FILE} not found at ${rootPath}; Using default config.`);
		return defineConfig({ ...DEFAULT_CONFIG, root: { path: rootPath } });
	}

	const useCache = options?.cache !== false;
	const cacheDir = join(rootPath, ...CACHE_DIR_SEGMENTS);
	const baseDir = dirname(resolve(manifestPath));

	let reusableBundlePath: string | null = null;

	if (useCache) {
		reusableBundlePath = await findReusableBundle(cacheDir, baseDir);
	}

	let bundlePath: string;

	if (reusableBundlePath !== null) {
		bundlePath = reusableBundlePath;

		if (options?.verbose) {
			console.info('⚙️ [config] reused cached bundle');
		}
	} else {
		const compileOptions = { cacheDir, baseDir, externals: CONFIG_EXTERNALS };

		try {
			const compiled = await compileConfig(manifestPath, compileOptions);
			bundlePath = compiled.bundlePath;
		} catch (error) {
			throw new Error(
				`Failed to bundle workspace manifest at ${manifestPath}: ${formatError(error)}`,
			);
		}

		console.info('⚙️ [config] rebuilt bundle');
	}

	if (!useCache) {
		console.info('⚙️ [config] cache bypassed, rebuilt bundle');
	}

	removeLegacyBundle(rootPath);

	try {
		const config = await importConfigModule<PartialWorkspaceConfig>(bundlePath);

		return defineConfig({ ...config, root: { path: rootPath } });
	} catch (error) {
		throw new Error(`Failed to load workspace manifest at ${manifestPath}: ${formatError(error)}`);
	}
}
