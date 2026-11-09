import { createGenericOperation } from '@art-lib/operations';

import type { PullPending } from '../../operations/types.js';
import type { Checkout } from '../../store/createCheckout.js';

export function createPullOperation(checkout: Checkout, branch: string): PullPending {
	const data = {
		checkout,
		branch,
	};
	const toText = () => {
		return `from origin/${branch}`;
	};
	return createGenericOperation('pull', data, toText);
}
