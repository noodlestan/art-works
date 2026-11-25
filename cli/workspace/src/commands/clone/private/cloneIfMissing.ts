import { doClone } from '../../../private/commands/checkouts/doClone.js';
import type { WorkspaceContext } from '../../../private/context/createWorkspaceContext.js';
import { scanCheckoutState } from '../../../private/scan/scanCheckoutState.js';
import type { Checkout } from '../../../private/store/createCheckout.js';

export async function cloneIfMissing(
	ctx: WorkspaceContext,
	checkout: Checkout,
): Promise<Checkout | null> {
	const scanned = await scanCheckoutState(ctx, checkout);
	if (!scanned.scan?.should?.('clone')) {
		return scanned;
	}

	if (!scanned.repo) {
		return null;
	}

	return doClone(ctx, scanned);
}
