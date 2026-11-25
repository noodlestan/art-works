import { createOperationFailure, createOperationSuccess } from '@art-lib/operations';
import { simpleGit } from 'simple-git';

import type { WorkspaceContext } from '../../context/createWorkspaceContext.js';
import { createPushOperation } from '../../operations/createPushOperation.js';
import { scanCheckoutState } from '../../scan/scanCheckoutState.js';
import type { Checkout } from '../../store/createCheckout.js';

export async function doPushWorkspaceCheckout(ctx: WorkspaceContext): Promise<Checkout | null> {
	const workspace = ctx.workspace;
	if (!workspace) {
		throw new Error('No workspace in context.');
	}

	if (!workspace.scan?.can?.('push')) {
		return null;
	}

	const pending = createPushOperation(workspace, workspace.record.branch);
	const git = simpleGit(workspace.path);
	try {
		ctx.operations.log(pending);
		await git.push('origin', workspace.record.branch);
		const updated = await scanCheckoutState(ctx, workspace, true);
		ctx.operations.log(createOperationSuccess(pending));
		return updated;
	} catch (error) {
		ctx.operations.log(createOperationFailure(pending, error));
		return null;
	}
}
