import { createGenericOperation } from '@art-lib/operations';

import type { Checkout } from '../store/createCheckout.js';

import type { PushPending } from './types.js';

export function createPushOperation(checkout: Checkout, branch: string): PushPending {
	const data = {
		checkout,
		branch,
	};
	const toText = () => {
		return `to origin/${branch}`;
	};
	return createGenericOperation('push', data, toText);
}
