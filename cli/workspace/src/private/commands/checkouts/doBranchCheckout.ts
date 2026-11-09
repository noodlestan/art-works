import { createOperationFailure, createOperationSuccess } from '@art-lib/operations';

import type { WorkspaceContext } from '../../context/createWorkspaceContext.js';
import { createOrSwitchBranch } from '../../git/createOrSwitchBranch.js';
import { upsertCheckoutRecord } from '../../resources/checkout/upsertCheckoutRecord.js';
import type { Checkout } from '../../store/createCheckout.js';
import { createBranchOperation } from '../operations/createBranchOperation.js';

export async function doBranchCheckout(
	ctx: WorkspaceContext,
	checkout: Checkout,
	branch: string,
): Promise<Checkout | null> {
	const pending = createBranchOperation(checkout, branch);
	try {
		ctx.log.log(pending);
		const outcome = await createOrSwitchBranch(checkout.path, branch);
		ctx.log.log(
			createOperationSuccess(
				pending,
				outcome === 'created' ? `created ${branch}` : `switched to ${branch}`,
			),
		);

		const withRecord = await upsertCheckoutRecord(ctx, {
			...checkout,
			record: { ...checkout.record, branch },
		});
		ctx.store.updateCheckout(withRecord);
		return withRecord;
	} catch (error) {
		ctx.log.log(createOperationFailure(createBranchOperation(checkout, branch), error));
		return null;
	}
}
