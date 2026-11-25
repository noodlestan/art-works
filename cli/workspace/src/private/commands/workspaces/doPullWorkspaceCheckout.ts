import { createOperationFailure, createOperationSuccess } from '@art-lib/operations';
import { simpleGit } from 'simple-git';

import type { WorkspaceContext } from '../../context/createWorkspaceContext.js';
import { createPullOperation } from '../../operations/createPullOperation.js';
import { scanCheckoutState } from '../../scan/scanCheckoutState.js';
import type { Checkout } from '../../store/createCheckout.js';

export async function doPullWorkspaceCheckout(ctx: WorkspaceContext): Promise<Checkout | null> {
	const workspace = ctx.workspace;
	if (!workspace) {
		throw new Error('No workspace in context.');
	}
	if (!workspace.scan?.can?.('pull')) {
		return null;
	}

	const pending = createPullOperation(workspace, workspace.record.branch);
	const git = simpleGit(workspace.path);
	try {
		ctx.operations.log(pending);
		await git.pull('origin', workspace.record.branch);
		const updated = await scanCheckoutState(ctx, workspace, true);
		ctx.operations.log(createOperationSuccess(pending));
		return updated;
	} catch (error) {
		const failure = createOperationFailure(pending, error);
		ctx.operations.log(failure);
		return null;
	}
}
