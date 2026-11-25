import { createGenericOperation } from '@art-lib/operations';

import type { Checkout } from '../store/createCheckout.js';

import type { PublishPending } from './types.js';

export function createPublishOperation(
	checkout: Checkout | undefined,
	pkg: string,
	version: string,
): PublishPending {
	const data = {
		checkout,
		package: pkg,
		version,
	};
	const toText = () => {
		return `publishing ${pkg}@${version}`;
	};
	return createGenericOperation('publish', data, toText);
}
