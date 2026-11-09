import { createOperationFailure, createOperationSuccess } from '@art-lib/operations';

import type { WorkspaceContext } from '../../context/createWorkspaceContext.js';
import { pullCheckout } from '../../git/pullCheckout.js';
import { scanCheckoutState } from '../../scan/scanCheckoutState.js';
import type { Checkout } from '../../store/createCheckout.js';
import { createPullOperation } from '../operations/createPullOperation.js';

export async function doPullCheckout(
	ctx: WorkspaceContext,
	checkout: Checkout,
): Promise<Checkout | null> {
	const pending = createPullOperation(checkout, checkout.record.branch);
	try {
		ctx.log.log(pending);
		await pullCheckout(checkout.path, checkout.record.branch);
		const updated = await scanCheckoutState(ctx, checkout, true);
		ctx.store.updateCheckout(updated);
		ctx.log.log(createOperationSuccess(pending));
		return updated;
	} catch (error) {
		ctx.log.log(createOperationFailure(pending, error));
		return null;
	}
}
