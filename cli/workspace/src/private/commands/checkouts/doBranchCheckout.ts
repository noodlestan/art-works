import { createOperationFailure, createOperationSuccess } from '@art-lib/operations';

import type { WorkspaceContext } from '../../context/createWorkspaceContext.js';
import { createOrSwitchBranch } from '../../git/createOrSwitchBranch.js';
import { createBranchOperation } from '../../operations/createBranchOperation.js';
import { upsertCheckoutRecord } from '../../resources/checkout/upsertCheckoutRecord.js';
import type { Checkout } from '../../store/createCheckout.js';

export async function doBranchCheckout(
	ctx: WorkspaceContext,
	checkout: Checkout,
	branch: string,
): Promise<Checkout | null> {
	const pending = createBranchOperation(checkout, branch);
	ctx.operations.log(pending);

	try {
		const outcome = await createOrSwitchBranch(checkout.path, branch);

		const text = outcome === 'created' ? `created ${branch}` : `switched to ${branch}`;
		const success = createOperationSuccess(pending, text);
		ctx.operations.log(success);

		const withRecord = await upsertCheckoutRecord(ctx, {
			...checkout,
			record: { ...checkout.record, branch },
		});
		ctx.store.updateCheckout(withRecord);
		return withRecord;
	} catch (error) {
		ctx.operations.log(createOperationFailure(createBranchOperation(checkout, branch), error));
		return null;
	}
}
