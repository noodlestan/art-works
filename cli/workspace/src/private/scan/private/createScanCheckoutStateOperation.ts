import { createGenericOperation } from '@art-lib/operations';

import type { ScanCheckoutStatePending } from '../../operations/types.js';
import type { Checkout } from '../../store/types.js';

/**
 * Opens the scan of one checkout. It is never finished — the scan either
 * produces a Checkout with states or nothing at all — so it stays pending and
 * never reaches the operations report.
 */
export function createScanCheckoutStateOperation(checkout: Checkout): ScanCheckoutStatePending {
	const data = {
		checkout,
		location: checkout.record.location,
	};
	const toText = () => {
		return checkout.record.location;
	};
	return createGenericOperation('scan-checkout-state', data, toText);
}
