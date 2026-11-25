import { createGenericOperation } from '@art-lib/operations';

import type { Checkout } from '../store/createCheckout.js';

import type { BranchPending } from './types.js';

export function createBranchOperation(checkout: Checkout, branch: string): BranchPending {
	const data = {
		checkout,
		branch,
	};
	const toText = () => {
		return `branch ${branch}`;
	};
	return createGenericOperation('branch', data, toText);
}
