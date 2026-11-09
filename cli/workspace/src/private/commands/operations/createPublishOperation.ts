import { createGenericOperation } from '@art-lib/operations';

import type { PublishPending } from '../../operations/types.js';
import type { Checkout } from '../../store/createCheckout.js';

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
