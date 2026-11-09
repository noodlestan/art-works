import { createGenericOperation } from '@art-lib/operations';

import { runWithConcurrency } from '../async/runWithConcurrency.js';
import type { WorkspaceContext } from '../context/createWorkspaceContext.js';
import { scanCheckoutState } from '../scan/scanCheckoutState.js';

export async function scanAllCheckoutsStates(
	ctx: WorkspaceContext,
	refetch = false,
): Promise<void> {
	ctx.log.log(createGenericOperation('scan-all-checkouts'));
	await runWithConcurrency(ctx.store.getAllCheckouts(), 4, async checkout => {
		const updated = await scanCheckoutState(ctx, checkout, refetch);
		ctx.store.updateCheckout(updated);
	});
}
