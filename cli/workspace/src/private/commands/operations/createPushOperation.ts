import { createGenericOperation } from '@art-lib/operations';

import type { PushPending } from '../../operations/types.js';
import type { Checkout } from '../../store/createCheckout.js';

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
