import { createOperationFailure, createOperationSuccess } from '@art-lib/operations';

import type { WorkspaceContext } from '../../context/createWorkspaceContext.js';
import { cloneCheckout } from '../../git/cloneCheckout.js';
import { getCurrentBranch } from '../../git/getCurrentBranch.js';
import { createCloneOperation } from '../../operations/createCloneOperation.js';
import { upsertCheckoutRecord } from '../../resources/checkout/upsertCheckoutRecord.js';
import { scanCheckoutState } from '../../scan/scanCheckoutState.js';
import type { Checkout } from '../../store/createCheckout.js';

export async function doClone(ctx: WorkspaceContext, checkout: Checkout): Promise<Checkout | null> {
	if (!checkout.repo) return null;

	const pending = createCloneOperation(checkout);
	try {
		ctx.operations.log(pending);
		await cloneCheckout(checkout.repo.remote, checkout.path, checkout.record.branch);
		const rescan = await scanCheckoutState(ctx, checkout);
		ctx.operations.log(createOperationSuccess(createCloneOperation(rescan)));

		const actualBranch = await getCurrentBranch(checkout.path);
		const withRecord = await upsertCheckoutRecord(ctx, {
			...rescan,
			record: { ...rescan.record, branch: actualBranch || rescan.record.branch || 'main' },
		});
		ctx.store.updateCheckout(withRecord);

		return withRecord;
	} catch (error) {
		ctx.operations.log(createOperationFailure(pending, error));
		return null;
	}
}
