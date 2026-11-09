import { createGenericOperation } from '@art-lib/operations';

import type { CheckoutRunPending } from '../../operations/types.js';
import type { Checkout } from '../../store/createCheckout.js';

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
