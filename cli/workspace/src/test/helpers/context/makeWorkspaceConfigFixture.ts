import { resolve } from 'node:path';

import {
	DEFAULT_RECORDS_PATTERN,
	DEFAULT_RECORDS_STORE_OPTIONS,
} from '../../../config/constants.js';
import type { WorkspaceConfig } from '../../../config/index.js';

/** @provides a workspace config fixture with optional overrides. */
export function makeWorkspaceConfigFixture(
	rootPath: string,
	overrides?: Partial<WorkspaceConfig>,
): WorkspaceConfig {
	return {
		root: { path: rootPath },
		checkouts: { path: 'checkouts' },
		data: {
			store: { ...DEFAULT_RECORDS_STORE_OPTIONS, basePath: resolve(rootPath, '_records') },
			template: 'checkout.art.njk',
		},
		discover: {
			records: {
				paths: [DEFAULT_RECORDS_PATTERN],
			},
		},
		...overrides,
	};
}
