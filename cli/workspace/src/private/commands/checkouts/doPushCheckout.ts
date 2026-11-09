import { createOperationFailure, createOperationSuccess } from '@art-lib/operations';

import type { WorkspaceContext } from '../../context/createWorkspaceContext.js';
import { pushCheckout } from '../../git/pushCheckout.js';
import { scanCheckoutState } from '../../scan/scanCheckoutState.js';
import type { Checkout } from '../../store/createCheckout.js';
import { createPushOperation } from '../operations/createPushOperation.js';

export async function doPushCheckout(
	ctx: WorkspaceContext,
	checkout: Checkout,
): Promise<Checkout | null> {
	const pending = createPushOperation(checkout, checkout.record.branch);
	try {
		ctx.log.log(pending);
		await pushCheckout(checkout.path, checkout.record.branch);
		const updated = await scanCheckoutState(ctx, checkout, true);
		ctx.store.updateCheckout(updated);
		ctx.log.log(createOperationSuccess(pending));
		return updated;
	} catch (error) {
		ctx.log.log(createOperationFailure(pending, error));
		return null;
	}
}
