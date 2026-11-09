import { createOperationFailure, createOperationSuccess } from '@art-lib/operations';
import { simpleGit } from 'simple-git';

import type { WorkspaceContext } from '../../context/createWorkspaceContext.js';
import { scanCheckoutState } from '../../scan/scanCheckoutState.js';
import type { Checkout } from '../../store/createCheckout.js';
import { createPullOperation } from '../operations/createPullOperation.js';

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
		ctx.log.log(pending);
		await git.pull('origin', workspace.record.branch);
		const updated = await scanCheckoutState(ctx, workspace, true);
		ctx.log.log(createOperationSuccess(pending));
		return updated;
	} catch (error) {
		ctx.log.log(
			createOperationFailure(createPullOperation(workspace, workspace.record.branch), error),
		);
		return null;
	}
}
