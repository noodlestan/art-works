import { createGenericOperation } from '@art-lib/operations';

import type { LinkedPending } from '../../operations/types.js';
import type { Checkout } from '../../store/createCheckout.js';

export function createLinkedOperation(
	checkout: Checkout | undefined,
	pkg: string,
	target: string,
): LinkedPending {
	const data = {
		checkout,
		package: pkg,
		target,
	};
	const toText = () => {
		return `linking ${pkg}`;
	};
	return createGenericOperation('linked', data, toText);
}
