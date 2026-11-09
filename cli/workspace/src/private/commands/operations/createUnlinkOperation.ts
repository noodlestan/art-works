import { createGenericOperation } from '@art-lib/operations';

import type { UnlinkPending } from '../../operations/types.js';
import type { Checkout } from '../../store/createCheckout.js';

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
