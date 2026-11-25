import { createGenericOperation } from '@art-lib/operations';

import type { WorkspaceContext } from '../../private/context/createWorkspaceContext.js';
import { createLinkedOperation } from '../../private/operations/createLinkedOperation.js';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function runLink(ctx: WorkspaceContext, options: { root: string }): Promise<void> {
	ctx.operations.log(createGenericOperation('command', ['link', options]));
	ctx.operations.log(createLinkedOperation(ctx.workspace, '', ''));
	// TODO: implement link command
	console.info('link command - TODO');
}
