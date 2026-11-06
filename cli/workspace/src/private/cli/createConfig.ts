import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import { loadWorkspaceConfig } from '../../config/loadWorkspaceConfig.js';
import type { WorkspaceConfig } from '../../config/types.js';
import type { LoggerAPI as Logger } from '../logger/createLogger.js';
import { createGenericOperation } from '../operations/createGenericOperation.js';

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
	logger: Logger,
	root: string,
	options?: { cache?: boolean; verbose?: boolean },
): Promise<WorkspaceConfig> {
	logger.log(createGenericOperation('locate-config'));
	const configRoot = discoverConfigRoot(root) ?? root;
	logger.log(createGenericOperation('load-config'));
	return await loadWorkspaceConfig(configRoot, options);
}
