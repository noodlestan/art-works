import type { Checkout } from '../../../private/store/createCheckout.js';

import { makeCheckoutScanFixture } from './makeCheckoutScanFixture.js';

export function makeWorkspaceCheckoutFixture(
	path: string,
	overrides?: Partial<Checkout>,
): Checkout {
	return {
		repo: undefined,
		record: { name: 'Workspace', location: '.', branch: 'main', repository: undefined },
		path,
		scan: makeCheckoutScanFixture([]),
		...overrides,
	};
}
