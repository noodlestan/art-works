import { createGenericOperation } from '@art-lib/operations';

import { createUnlinkOperation } from '../../private/commands/operations/createUnlinkOperation.js';
import type { WorkspaceContext } from '../../private/context/createWorkspaceContext.js';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function runUnlink(ctx: WorkspaceContext, options: { root: string }): Promise<void> {
	ctx.log.log(createGenericOperation('command', ['unlink', options]));
	ctx.log.log(createUnlinkOperation(ctx.workspace, '', ''));
	// TODO: implement unlink command
	console.info('unlink command - TODO');
}
