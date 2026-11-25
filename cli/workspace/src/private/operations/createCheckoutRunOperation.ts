import { createGenericOperation } from '@art-lib/operations';

import type { Checkout } from '../store/createCheckout.js';

import type { CheckoutRunPending } from './types.js';

export function createCheckoutRunOperation(
	checkout: Checkout,
	command: string,
): CheckoutRunPending {
	const data = {
		checkout,
		command,
	};
	const toText = () => {
		return command;
	};
	return createGenericOperation('run', data, toText);
}
