import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import { type OperationsLog, createGenericOperation } from '@art-lib/operations';

import { loadWorkspaceConfig } from '../../config/loadWorkspaceConfig.js';
import type { WorkspaceConfig } from '../../config/types.js';

const MANIFEST_FILE = '.art-workspace.mts';

/**
 * Walks up from `startDir` through its parents and returns the first directory
 * holding the workspace manifest — the config root. `null` when no directory in
 * the chain holds one, so the caller can fall back to the default config.
 */
function discoverConfigRoot(startDir: string): string | null {
	let current = resolve(startDir);

	while (!existsSync(join(current, MANIFEST_FILE))) {
		const parent = dirname(current);

		if (parent === current) {
			return null;
		}

		current = parent;
	}

	return current;
}

export async function createConfig(
	operations: OperationsLog,
	root: string,
	options?: { cache?: boolean; verbose?: boolean },
): Promise<WorkspaceConfig> {
	operations.log(createGenericOperation('locate-config'));
	const configRoot = discoverConfigRoot(root);

	if (configRoot === null) {
		console.info('running without config');
	} else {
		console.info(`Running from config at ${join(configRoot, MANIFEST_FILE)}`);
	}

	operations.log(createGenericOperation('load-config'));
	return await loadWorkspaceConfig(configRoot ?? root, options);
}
