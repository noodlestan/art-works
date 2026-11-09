import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { createGenericOperation } from '@art-lib/operations';

import type { WorkspaceContext } from '../../private/context/createWorkspaceContext.js';

const MANIFEST_FILE = '.art-workspace.mts';

/**
 * The starting-point manifest `init` writes: the default values for `root.path`
 * and `checkouts.path` redeclared, plus the default `data.store` and
 * `discover.records` under the current config names. It is a plain default
 * export with no package import, so a fresh workspace loads it without a local
 * `node_modules` when the CLI is installed globally.
 */
const INIT_MANIFEST_SOURCE = `export default {
	root: { path: process.cwd() },
	checkouts: { path: 'checkouts' },
	data: {
		store: {
			basePath: '_records/',
			patterns: [
				{
					base: '.',
					pattern: '*.art',
					ignored: ['node_modules/', '.git/', 'dist/'],
					excluded: [],
					gitignore: true,
				},
			],
		},
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
`;

/**
 * Creates `.art-workspace.mts` in the workspace root with default values.
 * Refuses to overwrite an existing manifest. Returns whether it was created.
 */
export async function runInit(ctx: WorkspaceContext, options: { root: string }): Promise<boolean> {
	ctx.log.log(createGenericOperation('command', ['init', options]));

	const manifestPath = join(options.root, MANIFEST_FILE);

	if (existsSync(manifestPath)) {
		console.warn(`${MANIFEST_FILE} already exists at ${options.root}`);
		return false;
	}

	writeFileSync(manifestPath, INIT_MANIFEST_SOURCE, 'utf8');
	console.info(`Created ${MANIFEST_FILE} at ${options.root}`);

	return true;
}
