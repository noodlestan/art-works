import { createGenericOperation } from '@art-lib/operations';

import type { Checkout } from '../store/createCheckout.js';

import type { ClonePending } from './types.js';

export function createCloneOperation(checkout: Checkout | undefined): ClonePending {
	const data = {
		checkout,
		location: checkout?.record.location ?? 'unknown',
	};
	const toText = () => {
		return checkout ? `to ${checkout.record.location}` : 'clone';
	};
	return createGenericOperation('clone', data, toText);
}
