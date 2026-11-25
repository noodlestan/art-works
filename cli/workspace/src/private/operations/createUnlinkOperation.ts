import { createGenericOperation } from '@art-lib/operations';

import type { Checkout } from '../store/createCheckout.js';

import type { UnlinkPending } from './types.js';

export function createUnlinkOperation(
	checkout: Checkout | undefined,
	pkg: string,
	source: string,
): UnlinkPending {
	const data = {
		checkout,
		package: pkg,
		source,
	};
	const toText = () => {
		return `unlinking ${pkg}`;
	};
	return createGenericOperation('unlink', data, toText);
}
