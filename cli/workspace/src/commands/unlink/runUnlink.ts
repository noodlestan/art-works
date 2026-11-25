import { createGenericOperation } from '@art-lib/operations';

import type { WorkspaceContext } from '../../private/context/createWorkspaceContext.js';
import { createUnlinkOperation } from '../../private/operations/createUnlinkOperation.js';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function runUnlink(ctx: WorkspaceContext, options: { root: string }): Promise<void> {
	ctx.operations.log(createGenericOperation('command', ['unlink', options]));
	ctx.operations.log(createUnlinkOperation(ctx.workspace, '', ''));
	// TODO: implement unlink command
	console.info('unlink command - TODO');
}
