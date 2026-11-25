import { createGenericOperation } from '@art-lib/operations';

import type { Checkout } from '../store/createCheckout.js';

import type { PullPending } from './types.js';

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
